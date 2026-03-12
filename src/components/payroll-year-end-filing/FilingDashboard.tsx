"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { buildFilingOpsStepHref, summarizeFilingWorkflowGates } from "@/components/payroll-year-end-filing/filing-workflow-helpers";
import { FILING_STEP_DEFINITIONS } from "@/components/payroll-year-end-filing/filing-types";
import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";
import { useFilingWorkflow } from "@/contexts/FilingWorkflowContext";

type FilingDashboardProps = {
  title?: string;
};

export default function FilingDashboard({ title = "Filing Workflow Dashboard" }: FilingDashboardProps) {
  const workflow = useFilingWorkflow();
  const searchParams = useSearchParams();
  const source = searchParams.get("source");
  const gateSummary = summarizeFilingWorkflowGates(workflow.gates);

  return (
    <section className="panel" id="filing-workflow-dashboard">
      <h2>{title}</h2>
      <p className="small">
        Flat workflow route mode. gates ready {gateSummary.ready}/{gateSummary.total} (
        {(gateSummary.ratio * 100).toFixed(0)}%)
      </p>

      <div className={styles.digestGrid} aria-label="filing workflow step cards">
        {FILING_STEP_DEFINITIONS.map((step) => (
          <div key={step.step} className={styles.digestRow}>
            <p className="small">
              <strong>{step.title}</strong> {workflow.currentStep === step.step ? "(current)" : ""}
            </p>
            <p className="small">{step.description}</p>
            <Link
              className="btn btn-secondary btn-small"
              href={buildFilingOpsStepHref({
                step: step.step,
                metadata: workflow.metadata,
                gates: workflow.gates,
                source
              })}
            >
              Open {step.title}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
