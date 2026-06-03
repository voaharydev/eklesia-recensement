import type { RefinementCtx } from "zod";

import { MAX_CHILD_AGE, MIN_ADULT_AGE } from "@/lib/constants/ages";

type AdultShape = {
  is_baptized: boolean;
  baptized_since?: string;
  is_mpiandry: boolean;
  mpiandry_since?: string;
  is_mpandray: boolean;
  mpandray_since?: string;
  age?: string;
};

type ChildShape = {
  is_baptized: boolean;
  baptized_since?: string;
  age?: string;
};

function parseAge(age: string | undefined): number | null {
  const trimmed = age?.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function refineAdultProfile(
  data: AdultShape,
  ctx: RefinementCtx,
  pathPrefix: (string | number)[] = [],
) {
  const datePath = (field: string) => [...pathPrefix, field];

  const parsedAge = parseAge(data.age);
  if (parsedAge === null) {
    ctx.addIssue({
      code: "custom",
      message: "L'âge est requis pour un membre adulte.",
      path: datePath("age"),
    });
  } else if (parsedAge < MIN_ADULT_AGE) {
    ctx.addIssue({
      code: "custom",
      message: `Un membre doit avoir plus de 15 ans (minimum ${MIN_ADULT_AGE} ans).`,
      path: datePath("age"),
    });
  }

  if (data.is_baptized && !data.baptized_since?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Indiquez la date de baptême.",
      path: datePath("baptized_since"),
    });
  }

  if (data.is_mpiandry && !data.mpiandry_since?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Indiquez depuis quand cette personne est mpiandry.",
      path: datePath("mpiandry_since"),
    });
  }

  if (data.is_mpandray && !data.mpandray_since?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Indiquez depuis quand cette personne est mpandray.",
      path: datePath("mpandray_since"),
    });
  }
}

export function refineChildProfile(
  data: ChildShape,
  ctx: RefinementCtx,
  pathPrefix: (string | number)[] = [],
) {
  const datePath = (field: string) => [...pathPrefix, field];

  const parsedAge = parseAge(data.age);
  if (parsedAge === null) {
    ctx.addIssue({
      code: "custom",
      message: "L'âge de l'enfant est requis.",
      path: datePath("age"),
    });
  } else if (parsedAge < 0 || parsedAge > MAX_CHILD_AGE) {
    ctx.addIssue({
      code: "custom",
      message: `L'âge d'un enfant doit être entre 0 et ${MAX_CHILD_AGE} ans.`,
      path: datePath("age"),
    });
  }

  if (data.is_baptized && !data.baptized_since?.trim()) {
    ctx.addIssue({
      code: "custom",
      message: "Indiquez la date de baptême.",
      path: datePath("baptized_since"),
    });
  }
}
