"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import FilingDashboard from "@/components/payroll-year-end-filing/FilingDashboard";
import FilingStepPanel from "@/components/payroll-year-end-filing/FilingStepPanel";
import {
  buildFilingWorkflowStateFromSearchParams,
  buildDefaultFilingWorkflowMetadata,
  buildDefaultFilingWorkflowGates
} from "@/components/payroll-year-end-filing/filing-workflow-helpers";
import type { FilingWorkflowStep } from "@/components/payroll-year-end-filing/filing-types";
import { FilingWorkflowProvider } from "@/contexts/FilingWorkflowContext";

type FilingOpsWorkflowStepPageProps = {
  step: FilingWorkflowStep;
};

export default function FilingOpsWorkflowStepPage({ step }: FilingOpsWorkflowStepPageProps) {
  const searchParams = useSearchParams();
  const signature = searchParams.toString();

  const initial = useMemo(
    () =>
      buildFilingWorkflowStateFromSearchParams(
        {
          get: (key) => searchParams.get(key)
        },
        step
      ),
    [searchParams, step]
  );

  return (
    <FilingWorkflowProvider
      key={`${step}:${signature}`}
      initialStep={step}
      initialMetadata={buildDefaultFilingWorkflowMetadata(initial.metadata)}
      initialGates={{ ...buildDefaultFilingWorkflowGates(), ...initial.gates }}
    >
      <FilingDashboard title="Filing Workflow Dashboard (Flat Route)" />
      <FilingStepPanel />
    </FilingWorkflowProvider>
  );
}
