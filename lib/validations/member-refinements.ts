import type { RefinementCtx } from "zod";

import { MAX_CHILD_AGE, MIN_ADULT_AGE } from "@/lib/constants/ages";
import type { ValidationTranslator } from "@/lib/validations/create-schemas";

type AdultShape = {
  is_baptized: boolean;
  baptized_since?: string;
  is_mpiandry: boolean;
  mpiandry_since?: string;
  is_mpandray: boolean;
  mpandray_since?: string;
  is_sefala: boolean;
  sefala_since?: string;
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

export function createRefinements(t: ValidationTranslator) {
  function refineAdultProfile(
    data: AdultShape,
    ctx: RefinementCtx,
    pathPrefix: (string | number)[] = [],
  ) {
    const datePath = (field: string) => [...pathPrefix, field];

    const parsedAge = parseAge(data.age);
    if (parsedAge === null) {
      ctx.addIssue({
        code: "custom",
        message: t("adultAgeRequired"),
        path: datePath("age"),
      });
    } else if (parsedAge < MIN_ADULT_AGE) {
      ctx.addIssue({
        code: "custom",
        message: t("adultMinAge", { min: MIN_ADULT_AGE }),
        path: datePath("age"),
      });
    }

    if (data.is_baptized && !data.baptized_since?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: t("baptismDateRequired"),
        path: datePath("baptized_since"),
      });
    }

    if (data.is_mpiandry && !data.mpiandry_since?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: t("mpiandryDateRequired"),
        path: datePath("mpiandry_since"),
      });
    }

    if (data.is_mpandray && !data.mpandray_since?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: t("mpandrayDateRequired"),
        path: datePath("mpandray_since"),
      });
    }

    if (data.is_sefala && !data.sefala_since?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: t("sefalaDateRequired"),
        path: datePath("sefala_since"),
      });
    }
  }

  function refineChildProfile(
    data: ChildShape,
    ctx: RefinementCtx,
    pathPrefix: (string | number)[] = [],
  ) {
    const datePath = (field: string) => [...pathPrefix, field];

    const parsedAge = parseAge(data.age);
    if (parsedAge === null) {
      ctx.addIssue({
        code: "custom",
        message: t("childAgeRequired"),
        path: datePath("age"),
      });
    } else if (parsedAge < 0 || parsedAge > MAX_CHILD_AGE) {
      ctx.addIssue({
        code: "custom",
        message: t("childAgeRange", { max: MAX_CHILD_AGE }),
        path: datePath("age"),
      });
    }

    if (data.is_baptized && !data.baptized_since?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: t("baptismDateRequired"),
        path: datePath("baptized_since"),
      });
    }
  }

  return { refineAdultProfile, refineChildProfile };
}
