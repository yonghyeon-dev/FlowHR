import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";
import type { FilingWorkflowMetadata } from "@/components/payroll-year-end-filing/filing-types";

type FilingExportBundleProps = {
  metadata: FilingWorkflowMetadata;
  onMetadataChange: (partial: Partial<FilingWorkflowMetadata>) => void;
};

export default function FilingExportBundle({ metadata, onMetadataChange }: FilingExportBundleProps) {
  return (
    <article className="panel" id="filing-workflow-export-bundle">
      <h3>Workflow Metadata</h3>
      <div className={styles.controlGrid}>
        <label>
          Metric
          <input
            value={metadata.metric}
            onChange={(event) => onMetadataChange({ metric: event.target.value })}
          />
        </label>
        <label>
          Alert Level
          <select
            value={metadata.level}
            onChange={(event) =>
              onMetadataChange({
                level: event.target.value === "critical" ? "critical" : "watch"
              })
            }
          >
            <option value="watch">watch</option>
            <option value="critical">critical</option>
          </select>
        </label>
        <label>
          Owner Role
          <input
            value={metadata.ownerRole}
            onChange={(event) => onMetadataChange({ ownerRole: event.target.value })}
          />
        </label>
        <label>
          Owner Actor ID
          <input
            value={metadata.ownerActorId}
            onChange={(event) => onMetadataChange({ ownerActorId: event.target.value })}
          />
        </label>
        <label>
          Value
          <input
            value={metadata.value ?? ""}
            onChange={(event) => {
              const trimmed = event.target.value.trim();
              if (trimmed.length === 0) {
                onMetadataChange({ value: null });
                return;
              }
              const parsed = Number.parseInt(trimmed, 10);
              onMetadataChange({ value: Number.isNaN(parsed) ? null : parsed });
            }}
          />
        </label>
      </div>
      <p className="small">
        Metadata is shared across all flat workflow steps through `FilingWorkflowContext`.
      </p>
    </article>
  );
}
