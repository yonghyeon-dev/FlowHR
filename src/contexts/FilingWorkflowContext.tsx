"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  type FilingWorkflowActionLogEntry,
  type FilingWorkflowGateKey,
  type FilingWorkflowGates,
  type FilingWorkflowMetadata,
  type FilingWorkflowState,
  type FilingWorkflowStep
} from "@/components/payroll-year-end-filing/filing-types";
import {
  buildDefaultFilingWorkflowGates,
  buildDefaultFilingWorkflowMetadata,
  getNextFilingWorkflowStep
} from "@/components/payroll-year-end-filing/filing-workflow-helpers";

type FilingWorkflowContextValue = FilingWorkflowState & {
  setCurrentStep: (step: FilingWorkflowStep) => void;
  setGate: (key: FilingWorkflowGateKey, value: boolean) => void;
  setMetadata: (partial: Partial<FilingWorkflowMetadata>) => void;
  recordAction: (message: string, actor: string) => void;
  advanceStep: () => void;
};

const FilingWorkflowContext = createContext<FilingWorkflowContextValue | null>(null);

type FilingWorkflowProviderProps = {
  initialStep: FilingWorkflowStep;
  initialMetadata?: Partial<FilingWorkflowMetadata>;
  initialGates?: Partial<FilingWorkflowGates>;
  children: ReactNode;
};

export function FilingWorkflowProvider({
  initialStep,
  initialMetadata,
  initialGates,
  children
}: FilingWorkflowProviderProps) {
  const [currentStep, setCurrentStep] = useState<FilingWorkflowStep>(initialStep);
  const [metadata, setMetadataState] = useState<FilingWorkflowMetadata>(() =>
    buildDefaultFilingWorkflowMetadata(initialMetadata)
  );
  const [gates, setGates] = useState<FilingWorkflowGates>(() => ({
    ...buildDefaultFilingWorkflowGates(),
    ...initialGates
  }));
  const [actionLog, setActionLog] = useState<FilingWorkflowActionLogEntry[]>([]);

  const setGate = useCallback((key: FilingWorkflowGateKey, value: boolean) => {
    setGates((prev) => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const setMetadata = useCallback((partial: Partial<FilingWorkflowMetadata>) => {
    setMetadataState((prev) => buildDefaultFilingWorkflowMetadata({ ...prev, ...partial }));
  }, []);

  const recordAction = useCallback(
    (message: string, actor: string) => {
      const trimmedMessage = message.trim();
      const trimmedActor = actor.trim();
      if (trimmedMessage.length === 0) {
        return;
      }
      setActionLog((prev) => [
        {
          id: `log-${Date.now()}`,
          step: currentStep,
          message: trimmedMessage,
          actor: trimmedActor || "system",
          at: new Date().toISOString()
        },
        ...prev
      ]);
    },
    [currentStep]
  );

  const advanceStep = useCallback(() => {
    setCurrentStep((prev) => getNextFilingWorkflowStep(prev));
  }, []);

  const value = useMemo<FilingWorkflowContextValue>(
    () => ({
      currentStep,
      gates,
      metadata,
      actionLog,
      setCurrentStep,
      setGate,
      setMetadata,
      recordAction,
      advanceStep
    }),
    [actionLog, advanceStep, currentStep, gates, metadata, recordAction, setGate, setMetadata]
  );

  return <FilingWorkflowContext.Provider value={value}>{children}</FilingWorkflowContext.Provider>;
}

export function useFilingWorkflow() {
  const context = useContext(FilingWorkflowContext);
  if (!context) {
    throw new Error("useFilingWorkflow must be used within FilingWorkflowProvider");
  }
  return context;
}
