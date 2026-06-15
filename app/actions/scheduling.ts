"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  failure,
  mapSupabaseError,
  success,
  type ActionResult,
} from "@/lib/actions/types";
import { assertAdminSession } from "@/lib/admin/auth";
import { localeSchema } from "@/lib/i18n/locale";
import { normalizeEmailForLookup } from "@/lib/registration/mappers";
import {
  buildWeekAssignments,
  getSundaysOfYear,
  getWeekNumberForSunday,
} from "@/lib/scheduling/rotation";
import {
  getCooldownStartDate,
  getRecentAssigneeEmails,
  pickVolunteerForSlot,
  type AssignmentHistoryEntry,
} from "@/lib/scheduling/cooldown";
import { getAuthenticatedPerson } from "@/lib/scheduling/member-auth";
import { countByStatus } from "@/lib/scheduling/status-ui";
import type {
  GenerateScheduleResult,
  MemberAssignmentRow,
  RecalculateDraftResult,
  ReplaceVolunteerOption,
  ServiceDetail,
  ServiceWithStatusCounts,
} from "@/lib/scheduling/types";
import { isMpamakyRole } from "@/lib/constants/service-roles";
import {
  getSchedulingPoolForRole,
  hasEmailForScheduling,
  isPersonEligibleForRole,
  personDisplayName,
} from "@/lib/scheduling/volunteers";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createAdminClient } from "@/lib/supabase/supabase";
import type {
  Person,
  ServiceAssignmentStatus,
  ServiceRoleCode,
} from "@/types/database";

async function requireAdmin(): Promise<ActionResult<never> | null> {
  try {
    await assertAdminSession();
    return null;
  } catch {
    return failure("Session admin invalide ou expirée.");
  }
}

const yearSchema = z.object({
  year: z.number().int().min(2020).max(2100),
});

const serviceIdSchema = z.object({
  serviceId: z.string().uuid(),
});

const replaceAssignmentSchema = z.object({
  assignmentId: z.string().uuid(),
  newPersonId: z.string().uuid(),
});

const updateRsvpSchema = z.object({
  assignmentId: z.string().uuid(),
  status: z.enum(["accepted", "declined"]),
  reason: z.string().max(500).optional(),
});

const loginOtpSchema = z.object({
  locale: localeSchema,
  email: z.string().email(),
});

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function fetchActiveAdultsWithEmail(): Promise<Person[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("persons")
    .select("*, household:households!inner(unregistered_at)")
    .is("household.unregistered_at", null)
    .eq("is_child", false)
    .not("email", "is", null);

  if (error) {
    throw new Error(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  return (data ?? []).filter(hasEmailForScheduling);
}

async function fetchMpamakyTenyPersons(): Promise<Person[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("persons")
    .select("*, household:households!inner(unregistered_at)")
    .is("household.unregistered_at", null)
    .eq("is_mpamaky_teny", true)
    .eq("is_child", false)
    .not("email", "is", null);

  if (error) {
    throw new Error(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  return (data ?? []).filter(hasEmailForScheduling);
}

async function fetchVolunteersForRole(
  roleCode: ServiceRoleCode,
): Promise<Person[]> {
  if (isMpamakyRole(roleCode)) {
    return fetchMpamakyTenyPersons();
  }
  return fetchActiveAdultsWithEmail();
}

type DraftAssignmentRow = {
  role_code: ServiceRoleCode;
  person_id: string;
  status: "draft";
};

async function fetchAssignmentHistory(
  fromDate: string,
  toDate: string,
): Promise<AssignmentHistoryEntry[]> {
  const supabase = createAdminClient();

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("id, service_date")
    .gte("service_date", fromDate)
    .lte("service_date", toDate);

  if (servicesError) {
    throw new Error(mapSupabaseError(servicesError, () => "Erreur inattendue."));
  }

  if (!services?.length) {
    return [];
  }

  const serviceDateById = new Map(
    services.map((service) => [service.id, service.service_date]),
  );
  const serviceIds = services.map((service) => service.id);

  const { data: assignments, error: assignmentsError } = await supabase
    .from("service_assignments")
    .select("service_id, role_code, person:persons(email)")
    .in("service_id", serviceIds);

  if (assignmentsError) {
    throw new Error(
      mapSupabaseError(assignmentsError, () => "Erreur inattendue."),
    );
  }

  const history: AssignmentHistoryEntry[] = [];

  for (const assignment of assignments ?? []) {
    const serviceDate = serviceDateById.get(assignment.service_id);
    const person = assignment.person as { email: string | null } | null;
    const email = person?.email?.trim();
    if (!serviceDate || !email) continue;

    history.push({
      serviceDate,
      email,
      roleCode: assignment.role_code as ServiceRoleCode,
    });
  }

  return history;
}

function buildAssignmentsForService(
  serviceDate: string,
  weekNumber: number,
  powerpointPool: Person[],
  mpamakyPool: Person[],
  history: AssignmentHistoryEntry[],
): DraftAssignmentRow[] {
  const slots = buildWeekAssignments(
    weekNumber,
    powerpointPool.length,
    mpamakyPool.length,
  );
  const recentEmails = getRecentAssigneeEmails(history, serviceDate);
  const alreadyPickedThisService = new Set<string>();
  const rows: DraftAssignmentRow[] = [];

  for (const slot of slots) {
    const pool = slot.roleCode === "powerpoint" ? powerpointPool : mpamakyPool;
    const person = pickVolunteerForSlot(
      pool,
      slot.personIndex,
      recentEmails,
      alreadyPickedThisService,
    );
    alreadyPickedThisService.add(normalizeEmailForLookup(person.email!));
    history.push({
      serviceDate,
      email: person.email!,
      roleCode: slot.roleCode,
    });
    rows.push({
      role_code: slot.roleCode,
      person_id: person.id,
      status: "draft",
    });
  }

  return rows;
}

async function loadSchedulingPools(): Promise<
  ActionResult<{ powerpointPool: Person[]; mpamakyPool: Person[] }>
> {
  const [powerpointCandidates, mpamakyCandidates] = await Promise.all([
    fetchActiveAdultsWithEmail(),
    fetchMpamakyTenyPersons(),
  ]);
  const powerpointPool = getSchedulingPoolForRole(
    powerpointCandidates,
    "powerpoint",
  );
  const mpamakyPool = getSchedulingPoolForRole(mpamakyCandidates, "priere");

  if (powerpointPool.length === 0) {
    return failure(
      "Aucun volontaire PowerPoint (Vaomiera Technika) avec email trouvé.",
    );
  }
  if (mpamakyPool.length === 0) {
    return failure("Aucun volontaire Mpamaky teny avec email trouvé.");
  }

  return success({ powerpointPool, mpamakyPool });
}

export async function generateYearlySchedule(
  input: unknown,
): Promise<ActionResult<GenerateScheduleResult>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = yearSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Année invalide.");
  }

  const { year } = parsed.data;

  try {
    const poolsResult = await loadSchedulingPools();
    if (poolsResult.error || !poolsResult.data) {
      return failure(poolsResult.error ?? "Erreur inattendue.");
    }
    const { powerpointPool, mpamakyPool } = poolsResult.data;

    const sundays = getSundaysOfYear(year);
    const supabase = createAdminClient();

    const { data: existingServices, error: existingError } = await supabase
      .from("services")
      .select("service_date")
      .gte("service_date", `${year}-01-01`)
      .lte("service_date", `${year}-12-31`);

    if (existingError) {
      return failure(mapSupabaseError(existingError, () => "Erreur inattendue."));
    }

    const existingDates = new Set(
      (existingServices ?? []).map((service) => service.service_date),
    );

    const batchHistory = await fetchAssignmentHistory(
      getCooldownStartDate(sundays[0]),
      sundays[sundays.length - 1],
    );

    let createdServices = 0;
    let skippedServices = 0;
    let createdAssignments = 0;

    for (let weekNumber = 0; weekNumber < sundays.length; weekNumber += 1) {
      const serviceDate = sundays[weekNumber];
      if (existingDates.has(serviceDate)) {
        skippedServices += 1;
        continue;
      }

      const { data: service, error: serviceError } = await supabase
        .from("services")
        .insert({ service_date: serviceDate })
        .select("id")
        .single();

      if (serviceError || !service) {
        return failure(
          mapSupabaseError(serviceError ?? { message: "Erreur culte." }, () =>
            "Erreur inattendue.",
          ),
        );
      }

      createdServices += 1;

      const assignments = buildAssignmentsForService(
        serviceDate,
        weekNumber,
        powerpointPool,
        mpamakyPool,
        batchHistory,
      ).map((row) => ({
        ...row,
        service_id: service.id,
      }));

      const { error: assignmentError } = await supabase
        .from("service_assignments")
        .insert(assignments);

      if (assignmentError) {
        return failure(mapSupabaseError(assignmentError, () => "Erreur inattendue."));
      }

      createdAssignments += assignments.length;
    }

    revalidatePath("/admin/cultes");

    return success({
      createdServices,
      skippedServices,
      createdAssignments,
    });
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Erreur lors de la génération.",
    );
  }
}

export async function recalculateUpcomingDraftSchedules(): Promise<
  ActionResult<RecalculateDraftResult>
> {
  const authError = await requireAdmin();
  if (authError) return authError;

  try {
    const poolsResult = await loadSchedulingPools();
    if (poolsResult.error || !poolsResult.data) {
      return failure(poolsResult.error ?? "Erreur inattendue.");
    }
    const { powerpointPool, mpamakyPool } = poolsResult.data;

    const supabase = createAdminClient();
    const today = todayIsoDate();
    const batchHistory = await fetchAssignmentHistory(
      getCooldownStartDate(today),
      today,
    );

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, service_date")
      .gte("service_date", today)
      .order("service_date", { ascending: true });

    if (servicesError) {
      return failure(mapSupabaseError(servicesError, () => "Erreur inattendue."));
    }

    if (!services?.length) {
      return success({
        updatedServices: 0,
        skippedServices: 0,
        updatedAssignments: 0,
      });
    }

    const serviceIds = services.map((service) => service.id);
    const { data: allAssignments, error: assignmentsError } = await supabase
      .from("service_assignments")
      .select("id, service_id, role_code, status")
      .in("service_id", serviceIds);

    if (assignmentsError) {
      return failure(mapSupabaseError(assignmentsError, () => "Erreur inattendue."));
    }

    const assignmentsByService = new Map<
      string,
      NonNullable<typeof allAssignments>
    >();
    for (const assignment of allAssignments ?? []) {
      const current = assignmentsByService.get(assignment.service_id) ?? [];
      current.push(assignment);
      assignmentsByService.set(assignment.service_id, current);
    }

    let updatedServices = 0;
    let skippedServices = 0;
    let updatedAssignments = 0;

    for (const service of services) {
      const assignments = assignmentsByService.get(service.id) ?? [];
      if (
        assignments.length === 0 ||
        assignments.some((assignment) => assignment.status !== "draft")
      ) {
        skippedServices += 1;
        continue;
      }

      const weekNumber = getWeekNumberForSunday(service.service_date);
      const newRows = buildAssignmentsForService(
        service.service_date,
        weekNumber,
        powerpointPool,
        mpamakyPool,
        batchHistory,
      );
      const assignmentByRole = new Map(
        assignments.map((assignment) => [assignment.role_code, assignment]),
      );

      for (const row of newRows) {
        const existing = assignmentByRole.get(row.role_code);
        if (!existing) continue;

        const { error: updateError } = await supabase
          .from("service_assignments")
          .update({ person_id: row.person_id })
          .eq("id", existing.id);

        if (updateError) {
          return failure(mapSupabaseError(updateError, () => "Erreur inattendue."));
        }

        updatedAssignments += 1;
      }

      updatedServices += 1;
    }

    revalidatePath("/admin/cultes");

    return success({
      updatedServices,
      skippedServices,
      updatedAssignments,
    });
  } catch (error) {
    return failure(
      error instanceof Error ? error.message : "Erreur lors du recalcul.",
    );
  }
}

export async function getUpcomingServices(): Promise<
  ActionResult<ServiceWithStatusCounts[]>
> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const supabase = createAdminClient();
  const today = todayIsoDate();

  const { data: services, error: servicesError } = await supabase
    .from("services")
    .select("*")
    .gte("service_date", today)
    .order("service_date", { ascending: true });

  if (servicesError) {
    return failure(mapSupabaseError(servicesError, () => "Erreur inattendue."));
  }

  if (!services?.length) {
    return success([]);
  }

  const serviceIds = services.map((service) => service.id);
  const { data: assignments, error: assignmentsError } = await supabase
    .from("service_assignments")
    .select("service_id, status")
    .in("service_id", serviceIds);

  if (assignmentsError) {
    return failure(mapSupabaseError(assignmentsError, () => "Erreur inattendue."));
  }

  const statusesByService = new Map<string, ServiceAssignmentStatus[]>();
  for (const assignment of assignments ?? []) {
    const current = statusesByService.get(assignment.service_id) ?? [];
    current.push(assignment.status);
    statusesByService.set(assignment.service_id, current);
  }

  const result: ServiceWithStatusCounts[] = services.map((service) => ({
    ...service,
    statusCounts: countByStatus(statusesByService.get(service.id) ?? []),
  }));

  return success(result);
}

export async function getServiceDetail(
  input: unknown,
): Promise<ActionResult<ServiceDetail>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = serviceIdSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Identifiant de culte invalide.");
  }

  const supabase = createAdminClient();
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("*")
    .eq("id", parsed.data.serviceId)
    .maybeSingle();

  if (serviceError) {
    return failure(mapSupabaseError(serviceError, () => "Erreur inattendue."));
  }
  if (!service) {
    return failure("Culte introuvable.");
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("service_assignments")
    .select("*, person:persons(*)")
    .eq("service_id", service.id)
    .order("role_code", { ascending: true });

  if (assignmentsError) {
    return failure(mapSupabaseError(assignmentsError, () => "Erreur inattendue."));
  }

  return success({
    ...service,
    assignments: (assignments ?? []).map((row) => ({
      ...row,
      person: row.person as Person,
    })),
  });
}

export async function sendInvitations(
  input: unknown,
): Promise<ActionResult<{ updated: number }>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = serviceIdSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Identifiant de culte invalide.");
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("service_assignments")
    .update({ status: "pending", decline_reason: null })
    .eq("service_id", parsed.data.serviceId)
    .eq("status", "draft")
    .select("id");

  if (error) {
    return failure(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  revalidatePath("/admin/cultes");
  revalidatePath(`/admin/cultes/${parsed.data.serviceId}`);

  return success({ updated: data?.length ?? 0 });
}

export async function replaceAssignment(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = replaceAssignmentSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Données de remplacement invalides.");
  }

  const supabase = createAdminClient();
  const { data: assignment, error: fetchError } = await supabase
    .from("service_assignments")
    .select("*, service:services(id)")
    .eq("id", parsed.data.assignmentId)
    .maybeSingle();

  if (fetchError) {
    return failure(mapSupabaseError(fetchError, () => "Erreur inattendue."));
  }
  if (!assignment || assignment.status !== "declined") {
    return failure("Seules les affectations refusées peuvent être remplacées.");
  }

  const { data: newPerson, error: personError } = await supabase
    .from("persons")
    .select("*, household:households!inner(unregistered_at)")
    .eq("id", parsed.data.newPersonId)
    .is("household.unregistered_at", null)
    .maybeSingle();

  if (personError) {
    return failure(mapSupabaseError(personError, () => "Erreur inattendue."));
  }
  if (
    !newPerson ||
    !isPersonEligibleForRole(newPerson, assignment.role_code)
  ) {
    return failure("Cette personne n'est pas éligible pour ce rôle.");
  }

  const { data: siblings, error: siblingsError } = await supabase
    .from("service_assignments")
    .select("id, status")
    .eq("service_id", assignment.service_id);

  if (siblingsError) {
    return failure(mapSupabaseError(siblingsError, () => "Erreur inattendue."));
  }

  const hasNonDraft = (siblings ?? []).some(
    (row) => row.status !== "draft" && row.id !== assignment.id,
  );
  const nextStatus: ServiceAssignmentStatus = hasNonDraft ? "pending" : "draft";

  const { data: updated, error: updateError } = await supabase
    .from("service_assignments")
    .update({
      person_id: parsed.data.newPersonId,
      status: nextStatus,
      decline_reason: null,
    })
    .eq("id", parsed.data.assignmentId)
    .select("id")
    .single();

  if (updateError || !updated) {
    return failure(mapSupabaseError(updateError ?? { message: "Erreur." }, () =>
      "Erreur inattendue.",
    ));
  }

  revalidatePath("/admin/cultes");
  revalidatePath(`/admin/cultes/${assignment.service_id}`);

  return success({ id: updated.id });
}

export async function getReplaceVolunteerOptions(
  input: unknown,
): Promise<ActionResult<ReplaceVolunteerOption[]>> {
  const authError = await requireAdmin();
  if (authError) return authError;

  const parsed = z
    .object({
      serviceId: z.string().uuid(),
      roleCode: z.enum([
        "powerpoint",
        "priere",
        "lecture_1",
        "lecture_2",
        "lecture_3",
      ]),
    })
    .safeParse(input);

  if (!parsed.success) {
    return failure("Paramètres invalides.");
  }

  const roleCode = parsed.data.roleCode as ServiceRoleCode;
  const candidates = await fetchVolunteersForRole(roleCode);
  const pool = getSchedulingPoolForRole(candidates, roleCode);

  const supabase = createAdminClient();
  const { data: assigned, error } = await supabase
    .from("service_assignments")
    .select("person_id")
    .eq("service_id", parsed.data.serviceId);

  if (error) {
    return failure(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  const assignedIds = new Set((assigned ?? []).map((row) => row.person_id));
  const options = pool
    .filter((person) => !assignedIds.has(person.id))
    .map((person) => ({
      id: person.id,
      label: personDisplayName(person),
    }));

  return success(options);
}

export async function getMemberAssignments(): Promise<
  ActionResult<MemberAssignmentRow[]>
> {
  const person = await getAuthenticatedPerson();
  if (!person) {
    return failure("Session invalide ou membre introuvable.");
  }

  const supabase = createAdminClient();
  const today = todayIsoDate();

  const { data, error } = await supabase
    .from("service_assignments")
    .select("*, service:services!inner(id, service_date, title)")
    .eq("person_id", person.id)
    .gte("service.service_date", today);

  if (error) {
    return failure(mapSupabaseError(error, () => "Erreur inattendue."));
  }

  return success(
    (data ?? [])
      .map((row) => ({
        ...row,
        service: row.service as MemberAssignmentRow["service"],
      }))
      .sort((a, b) => a.service.service_date.localeCompare(b.service.service_date)),
  );
}

export async function updateRsvpStatus(
  input: unknown,
): Promise<ActionResult<{ id: string; status: ServiceAssignmentStatus }>> {
  const person = await getAuthenticatedPerson();
  if (!person) {
    return failure("Session invalide ou membre introuvable.");
  }

  const parsed = updateRsvpSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Réponse invalide.");
  }

  const supabase = createAdminClient();
  const { data: assignment, error: fetchError } = await supabase
    .from("service_assignments")
    .select("id, person_id, status")
    .eq("id", parsed.data.assignmentId)
    .maybeSingle();

  if (fetchError) {
    return failure(mapSupabaseError(fetchError, () => "Erreur inattendue."));
  }
  if (!assignment || assignment.person_id !== person.id) {
    return failure("Affectation introuvable.");
  }
  if (assignment.status !== "pending") {
    return failure("Cette affectation ne peut plus être modifiée.");
  }

  const declineReason =
    parsed.data.status === "declined"
      ? parsed.data.reason?.trim() || null
      : null;

  const { data: updated, error: updateError } = await supabase
    .from("service_assignments")
    .update({
      status: parsed.data.status,
      decline_reason: declineReason,
    })
    .eq("id", parsed.data.assignmentId)
    .select("id, status")
    .single();

  if (updateError || !updated) {
    return failure(mapSupabaseError(updateError ?? { message: "Erreur." }, () =>
      "Erreur inattendue.",
    ));
  }

  revalidatePath("/fr/mon-planning");
  revalidatePath("/mg/mon-planning");
  revalidatePath("/admin/cultes");

  return success({ id: updated.id, status: updated.status });
}

export async function sendMagicLinkLogin(
  input: unknown,
): Promise<ActionResult<{ sent: true }>> {
  const parsed = loginOtpSchema.safeParse(input);
  if (!parsed.success) {
    return failure("Email invalide.");
  }

  const normalizedEmail = normalizeEmailForLookup(parsed.data.email);
  const supabaseAdmin = createAdminClient();

  const { data: candidates, error: lookupError } = await supabaseAdmin
    .from("persons")
    .select("email")
    .ilike("email", normalizedEmail)
    .limit(5);

  if (lookupError) {
    return failure(mapSupabaseError(lookupError, () => "Erreur inattendue."));
  }

  const hasMatch = (candidates ?? []).some(
    (person) => person.email?.trim().toLowerCase() === normalizedEmail,
  );

  if (!hasMatch) {
    return success({ sent: true });
  }

  const supabase = await createServerAuthClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/auth/callback?locale=${parsed.data.locale}`;

  const { error } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: { emailRedirectTo: redirectTo },
  });

  if (error) {
    return failure(error.message);
  }

  return success({ sent: true });
}

export async function signOutMember(): Promise<void> {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
}
