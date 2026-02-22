import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  CloseReportPublicationChannel,
  CloseReportPublicationEntry,
  CloseReportPublicationStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report";
import {
  CLOSE_REPORT_PUBLICATION_LABELS,
  type CloseReportPublicationDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report-ui";

type CloseReportPublicationPanelProps = {
  publicationEntries: readonly CloseReportPublicationEntry[];
  publicationDrafts: Record<CloseReportPublicationChannel, CloseReportPublicationDraft>;
  onPublicationDraftChange: (
    channel: CloseReportPublicationChannel,
    next: CloseReportPublicationDraft
  ) => void;
  onApplyPublicationChannel: (channel: CloseReportPublicationChannel) => void;
};

function publicationStatusClass(status: CloseReportPublicationStatus) {
  if (status === "published") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "queued") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsCloseReportPublicationPanel({
  publicationEntries,
  publicationDrafts,
  onPublicationDraftChange,
  onApplyPublicationChannel
}: CloseReportPublicationPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-publication">
      <h3>Close Report Publication Channels</h3>
      <div className={styles.digestGrid} aria-label="filing close report publication channels">
        {publicationEntries.map((entry) => {
          const draft = publicationDrafts[entry.channel];
          return (
            <div key={entry.channel} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSE_REPORT_PUBLICATION_LABELS[entry.channel]}</strong>
                <span className={publicationStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                artifact {entry.artifactId || "-"} / receiptRef {entry.receiptReference || "-"} / updatedAt{" "}
                {entry.updatedAt ? new Date(entry.updatedAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no publication note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onPublicationDraftChange(entry.channel, {
                        ...draft,
                        status: event.target.value as CloseReportPublicationStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="queued">queued</option>
                    <option value="published">published</option>
                  </select>
                </label>
                <label>
                  Artifact ID
                  <input
                    value={draft.artifactId}
                    onChange={(event) =>
                      onPublicationDraftChange(entry.channel, { ...draft, artifactId: event.target.value })
                    }
                  />
                </label>
                <label>
                  Receipt Reference
                  <input
                    value={draft.receiptReference}
                    onChange={(event) =>
                      onPublicationDraftChange(entry.channel, {
                        ...draft,
                        receiptReference: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onPublicationDraftChange(entry.channel, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyPublicationChannel(entry.channel)}>
                Apply Publication Channel
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
