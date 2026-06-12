import { SpiritualBadges } from "@/components/admin/spiritual-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getBranchLabel } from "@/lib/constants/branches";
import type { GroupedHouseholdMembers } from "@/lib/admin/types";
import { formatDateTimeShort } from "@/lib/format/datetime";
import type { Person } from "@/types/database";

export type HouseholdMemberListLabels = {
  head: string;
  spouse: string;
  otherAdults: string;
  children: string;
  noMembers: string;
  email: string;
  phone: string;
  age: string;
  branches: string;
  createdAt: string;
  updatedAt: string;
  spiritualLabels: {
    baptized: string;
    mpandray: string;
    mpiandry: string;
    mpamakyTeny: string;
  };
};

type HouseholdMemberListProps = {
  grouped: GroupedHouseholdMembers;
  roleLabels: Record<string, string>;
  labels: HouseholdMemberListLabels;
};

function formatBranches(person: Person): string {
  if (!person.branches?.length) return "—";
  return person.branches
    .map((b) => {
      const label = getBranchLabel(b.branch_code);
      return b.role ? `${label} (${b.role})` : label;
    })
    .join(", ");
}

function MemberRow({
  person,
  roleLabels,
  labels,
}: {
  person: Person;
  roleLabels: Record<string, string>;
  labels: HouseholdMemberListLabels;
}) {
  return (
    <li className="flex flex-col gap-2 border-b border-border py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="font-medium text-foreground">
          {person.last_name} {person.first_name}
        </p>
        <Badge className="mt-1">
          {roleLabels[person.role] ?? person.role}
        </Badge>
      </div>
      <div className="grid gap-1 text-sm text-muted sm:text-right">
        <p>
          {labels.email}: {person.email?.trim() || "—"}
        </p>
        <p>
          {labels.phone}: {person.phone?.trim() || "—"}
        </p>
        <p>
          {labels.age}: {person.age ?? "—"}
        </p>
        <p>
          {labels.branches}: {formatBranches(person)}
        </p>
        <p>
          {labels.createdAt}: {formatDateTimeShort(person.created_at)}
        </p>
        <p>
          {labels.updatedAt}: {formatDateTimeShort(person.updated_at)}
        </p>
        <div className="sm:flex sm:justify-end">
          <SpiritualBadges person={person} labels={labels.spiritualLabels} />
        </div>
      </div>
    </li>
  );
}

function MemberSection({
  title,
  members,
  roleLabels,
  labels,
}: {
  title: string;
  members: Person[];
  roleLabels: Record<string, string>;
  labels: HouseholdMemberListLabels;
}) {
  if (members.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </CardHeader>
      <CardContent className="pt-0">
        <ul>
          {members.map((person) => (
            <MemberRow
              key={person.id}
              person={person}
              roleLabels={roleLabels}
              labels={labels}
            />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function HouseholdMemberList({
  grouped,
  roleLabels,
  labels,
}: HouseholdMemberListProps) {
  const sections: { title: string; members: Person[] }[] = [
    { title: labels.head, members: grouped.head ? [grouped.head] : [] },
    { title: labels.spouse, members: grouped.spouse ? [grouped.spouse] : [] },
    { title: labels.otherAdults, members: grouped.otherAdults },
    { title: labels.children, members: grouped.children },
  ];

  const total = sections.reduce((sum, s) => sum + s.members.length, 0);

  if (total === 0) {
    return <p className="text-sm text-muted">{labels.noMembers}</p>;
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <MemberSection
          key={section.title}
          title={section.title}
          members={section.members}
          roleLabels={roleLabels}
          labels={labels}
        />
      ))}
    </div>
  );
}
