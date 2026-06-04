"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RegistrationWizardStep = 0 | 1 | 2;

type RegistrationWizardStateContextValue = {
  step: RegistrationWizardStep;
  setStep: (step: RegistrationWizardStep) => void;
};

const RegistrationWizardStateContext =
  createContext<RegistrationWizardStateContextValue | null>(null);

export function RegistrationWizardProvider({ children }: { children: ReactNode }) {
  const [step, setStep] = useState<RegistrationWizardStep>(0);

  const value = useMemo(() => ({ step, setStep }), [step]);

  return (
    <RegistrationWizardStateContext.Provider value={value}>
      {children}
    </RegistrationWizardStateContext.Provider>
  );
}

export function useRegistrationWizardStep(): RegistrationWizardStep {
  const ctx = useContext(RegistrationWizardStateContext);
  if (!ctx) {
    throw new Error(
      "useRegistrationWizardStep must be used within RegistrationWizardProvider",
    );
  }
  return ctx.step;
}

export function useSetRegistrationWizardStep(): (
  step: RegistrationWizardStep,
) => void {
  const ctx = useContext(RegistrationWizardStateContext);
  if (!ctx) {
    throw new Error(
      "useSetRegistrationWizardStep must be used within RegistrationWizardProvider",
    );
  }
  return ctx.setStep;
}
