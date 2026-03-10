import styles from "@/components/payroll-year-end-filing/FilingWorkflow.module.css";
import type { FilingWorkflowMetadata } from "@/components/payroll-year-end-filing/filing-types";
import { useI18n } from "@/lib/i18n/provider";

type FilingExportBundleProps = {
  metadata: FilingWorkflowMetadata;
  onMetadataChange: (partial: Partial<FilingWorkflowMetadata>) => void;
};

export default function FilingExportBundle({ metadata, onMetadataChange }: FilingExportBundleProps) {
  const { locale } = useI18n();
  const copy =
    locale === "ko"
      ? {
        title: "워크플로 요약",
        metricLabel: "관리 항목",
        severityLabel: "주의 수준",
        ownerRoleLabel: "담당 역할",
        ownerLabel: "담당자",
        valueLabel: "기준값",
        watchLabel: "관찰",
        criticalLabel: "긴급",
        description: "이 요약은 신고 워크플로 전 단계에서 공통으로 사용됩니다."
      }
      : {
        title: "Workflow Overview",
        metricLabel: "Tracking Item",
        severityLabel: "Alert Severity",
        ownerRoleLabel: "Owner Role",
        ownerLabel: "Owner",
        valueLabel: "Threshold Value",
        watchLabel: "Watch",
        criticalLabel: "Critical",
        description: "This summary is reused across every filing workflow step."
      };

  return (
    <article className="panel" id="filing-workflow-export-bundle">
      <h3>{copy.title}</h3>
      <div className={styles.controlGrid}>
        <label>
          {copy.metricLabel}
          <input
            value={metadata.metric}
            onChange={(event) => onMetadataChange({ metric: event.target.value })}
          />
        </label>
        <label>
          {copy.severityLabel}
          <select
            value={metadata.level}
            onChange={(event) =>
              onMetadataChange({
                level: event.target.value === "critical" ? "critical" : "watch"
              })
            }
          >
            <option value="watch">{copy.watchLabel}</option>
            <option value="critical">{copy.criticalLabel}</option>
          </select>
        </label>
        <label>
          {copy.ownerRoleLabel}
          <input
            value={metadata.ownerRole}
            onChange={(event) => onMetadataChange({ ownerRole: event.target.value })}
          />
        </label>
        <label>
          {copy.ownerLabel}
          <input
            value={metadata.ownerActorId}
            onChange={(event) => onMetadataChange({ ownerActorId: event.target.value })}
          />
        </label>
        <label>
          {copy.valueLabel}
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
      <p className="small">{copy.description}</p>
    </article>
  );
}
