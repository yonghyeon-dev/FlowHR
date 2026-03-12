"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { withAdminSource } from "@/app/admin/source-context";
import FilingActionLog from "@/components/payroll-year-end-filing/FilingActionLog";
import FilingExportBundle from "@/components/payroll-year-end-filing/FilingExportBundle";
import FilingGateCard from "@/components/payroll-year-end-filing/FilingGateCard";
import {
  buildFilingOpsStepHref,
  getFilingStepDefinition,
  getNextFilingWorkflowStep,
  getPreviousFilingWorkflowStep,
  summarizeFilingWorkflowGates
} from "@/components/payroll-year-end-filing/filing-workflow-helpers";
import { useFilingWorkflow } from "@/contexts/FilingWorkflowContext";

export default function FilingStepPanel() {
  const workflow = useFilingWorkflow();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const current = getFilingStepDefinition(workflow.currentStep);
  const previousStep = getPreviousFilingWorkflowStep(workflow.currentStep);
  const nextStep = getNextFilingWorkflowStep(workflow.currentStep);
  const gateSummary = summarizeFilingWorkflowGates(workflow.gates);
  const alertStepHref =
    source === "admin-payroll"
      ? withAdminSource("/admin/payroll-year-end-filing/ops/alert", "admin-payroll")
      : "/admin/payroll-year-end-filing/ops/alert";

  return (
    <section className="panel" id={`filing-workflow-step-${workflow.currentStep}`}>
      <h2>
        {current.title} Step
      </h2>
      <p className="small">{current.description}</p>
      <p className="small">
        step {workflow.currentStep} / gates ready {gateSummary.ready}/{gateSummary.total}
      </p>

      <div className="panel-actions">
        <Link href={alertStepHref} className="btn btn-secondary btn-small">
          Back to Alert Step
        </Link>
        <Link
          href={buildFilingOpsStepHref({
            step: previousStep,
            metadata: workflow.metadata,
            gates: workflow.gates,
            source
          })}
          className="btn btn-secondary btn-small"
        >
          Previous Step
        </Link>
        <Link
          href={buildFilingOpsStepHref({
            step: nextStep,
            metadata: workflow.metadata,
            gates: workflow.gates,
            source
          })}
          className="btn btn-secondary btn-small"
        >
          Next Step
        </Link>
        <button className="btn btn-secondary btn-small" onClick={workflow.advanceStep}>
          Advance in Context
        </button>
      </div>

      <FilingExportBundle metadata={workflow.metadata} onMetadataChange={workflow.setMetadata} />

      <FilingGateCard
        gates={workflow.gates}
        onGateChange={(key, value) => workflow.setGate(key, value)}
      />

      <FilingActionLog entries={workflow.actionLog} onRecordAction={workflow.recordAction} />
    </section>
  );
}
