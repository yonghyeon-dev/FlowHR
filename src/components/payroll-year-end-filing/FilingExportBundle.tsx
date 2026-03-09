import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";
import type { FilingWorkflowMetadata } from "@/components/payroll-year-end-filing/filing-types";

type FilingExportBundleProps = {
  metadata: FilingWorkflowMetadata;
  onMetadataChange: (partial: Partial<FilingWorkflowMetadata>) => void;
};

export default function FilingExportBundle({ metadata, onMetadataChange }: FilingExportBundleProps) {
  return (
    <article className="panel" id="filing-workflow-export-bundle">
      <h3>Workflow overview</h3>
      <div className={styles.controlGrid}>
        <label>
          Tracking item
          <input
            value={metadata.metric}
            onChange={(event) => onMetadataChange({ metric: event.target.value })}
          />
        </label>
        <label>
          Alert severity
          <select
            value={metadata.level}
            onChange={(event) =>
              onMetadataChange({
                level: event.target.value === "critical" ? "critical" : "watch"
              })
            }
          >
            <option value="watch">Watch</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          Owner role
          <input
            value={metadata.ownerRole}
            onChange={(event) => onMetadataChange({ ownerRole: event.target.value })}
          />
        </label>
        <label>
          Owner
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
        This summary is reused across the filing workflow steps.
      </p>
    </article>
  );
}
