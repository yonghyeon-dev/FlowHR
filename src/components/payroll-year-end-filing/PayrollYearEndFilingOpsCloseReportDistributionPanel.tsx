import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  CloseReportDistributionChannel,
  CloseReportDistributionEntry,
  CloseReportDistributionStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff";
import {
  CLOSE_REPORT_DISTRIBUTION_LABELS,
  type CloseReportDistributionDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-ui";

type CloseReportDistributionPanelProps = {
  distributionEntries: readonly CloseReportDistributionEntry[];
  distributionDrafts: Record<CloseReportDistributionChannel, CloseReportDistributionDraft>;
  onDistributionDraftChange: (
    channel: CloseReportDistributionChannel,
    next: CloseReportDistributionDraft
  ) => void;
  onApplyDistributionChannel: (channel: CloseReportDistributionChannel) => void;
};

function distributionStatusClass(status: CloseReportDistributionStatus) {
  if (status === "confirmed") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "distributed") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsCloseReportDistributionPanel({
  distributionEntries,
  distributionDrafts,
  onDistributionDraftChange,
  onApplyDistributionChannel
}: CloseReportDistributionPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-distribution">
      <h3>Close Report Distribution Channels</h3>
      <div className={styles.digestGrid} aria-label="filing close report distribution channels">
        {distributionEntries.map((entry) => {
          const draft = distributionDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSE_REPORT_DISTRIBUTION_LABELS[entry.channel]}</strong>
                <span className={distributionStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                batch {entry.batchId || "-"} / group {entry.targetGroup || "-"} / distributedAt{" "}
                {entry.distributedAt ? new Date(entry.distributedAt).toLocaleString("ko-KR") : "-"} / confirmedAt{" "}
                {entry.confirmedAt ? new Date(entry.confirmedAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no distribution note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onDistributionDraftChange(entry.channel, {
                        ...draft,
                        status: event.target.value as CloseReportDistributionStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="distributed">distributed</option>
                    <option value="confirmed">confirmed</option>
                  </select>
                </label>
                <label>
                  Batch ID
                  <input
                    value={draft.batchId}
                    onChange={(event) =>
                      onDistributionDraftChange(entry.channel, { ...draft, batchId: event.target.value })
                    }
                  />
                </label>
                <label>
                  Target Group
                  <input
                    value={draft.targetGroup}
                    onChange={(event) =>
                      onDistributionDraftChange(entry.channel, { ...draft, targetGroup: event.target.value })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onDistributionDraftChange(entry.channel, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyDistributionChannel(entry.channel)}>
                Apply Distribution Channel
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
