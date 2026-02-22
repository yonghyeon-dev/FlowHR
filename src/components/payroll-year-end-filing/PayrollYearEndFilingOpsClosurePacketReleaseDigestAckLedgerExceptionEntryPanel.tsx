import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionCategory,
  ClosurePacketReleaseDigestAckLedgerExceptionEntry,
  ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log";
import {
  CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CATEGORY_LABELS,
  type ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-ui";

type ClosurePacketReleaseDigestAckLedgerExceptionEntryPanelProps = {
  exceptionEntries: readonly ClosurePacketReleaseDigestAckLedgerExceptionEntry[];
  exceptionEntryDrafts: Record<
    ClosurePacketReleaseDigestAckLedgerExceptionCategory,
    ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft
  >;
  onExceptionEntryDraftChange: (
    category: ClosurePacketReleaseDigestAckLedgerExceptionCategory,
    next: ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft
  ) => void;
  onApplyExceptionEntry: (category: ClosurePacketReleaseDigestAckLedgerExceptionCategory) => void;
};

function exceptionEntryStatusClass(status: ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus) {
  if (status === "resolved") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "investigating") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionEntryPanel({
  exceptionEntries,
  exceptionEntryDrafts,
  onExceptionEntryDraftChange,
  onApplyExceptionEntry
}: ClosurePacketReleaseDigestAckLedgerExceptionEntryPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exceptions">
      <h3>Acknowledgment Exception Categories</h3>
      <div className={styles.digestGrid} aria-label="filing closure packet release digest acknowledgment exceptions">
        {exceptionEntries.map((entry) => {
          const draft = exceptionEntryDrafts[entry.category];
          return (
            <div key={entry.category} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CATEGORY_LABELS[entry.category]}</strong>
                <span className={exceptionEntryStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                incident {entry.incidentId || "-"} / reference {entry.referenceId || "-"} / openedAt{" "}
                {entry.openedAt ? new Date(entry.openedAt).toLocaleString("ko-KR") : "-"} / resolvedAt{" "}
                {entry.resolvedAt ? new Date(entry.resolvedAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no acknowledgment exception note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onExceptionEntryDraftChange(entry.category, {
                        ...draft,
                        status: event.target.value as ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus
                      })
                    }
                  >
                    <option value="open">open</option>
                    <option value="investigating">investigating</option>
                    <option value="resolved">resolved</option>
                  </select>
                </label>
                <label>
                  Incident ID
                  <input
                    value={draft.incidentId}
                    onChange={(event) =>
                      onExceptionEntryDraftChange(entry.category, {
                        ...draft,
                        incidentId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Reference ID
                  <input
                    value={draft.referenceId}
                    onChange={(event) =>
                      onExceptionEntryDraftChange(entry.category, {
                        ...draft,
                        referenceId: event.target.value
                      })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onExceptionEntryDraftChange(entry.category, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplyExceptionEntry(entry.category)}>
                Apply Exception Entry
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
