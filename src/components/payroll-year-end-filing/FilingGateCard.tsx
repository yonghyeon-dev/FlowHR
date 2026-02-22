import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";
import {
  FILING_WORKFLOW_GATE_KEYS,
  FILING_WORKFLOW_GATE_LABELS,
  type FilingWorkflowGateKey,
  type FilingWorkflowGates
} from "@/components/payroll-year-end-filing/filing-types";

type FilingGateCardProps = {
  gates: FilingWorkflowGates;
  onGateChange: (key: FilingWorkflowGateKey, value: boolean) => void;
};

export default function FilingGateCard({ gates, onGateChange }: FilingGateCardProps) {
  return (
    <article className="panel" id="filing-workflow-gates">
      <h3>Workflow Gates</h3>
      <div className={styles.controlGrid} aria-label="filing workflow gate controls">
        {FILING_WORKFLOW_GATE_KEYS.map((key) => (
          <label key={key}>
            {FILING_WORKFLOW_GATE_LABELS[key]}
            <select
              value={gates[key] ? "yes" : "no"}
              onChange={(event) => onGateChange(key, event.target.value === "yes")}
            >
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
        ))}
      </div>
    </article>
  );
}
