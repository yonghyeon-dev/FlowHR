import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionLogRecord,
  ClosurePacketReleaseDigestAckLedgerExceptionLogStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log";
import type { ClosurePacketReleaseDigestAckLedgerExceptionLogDraft } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type ClosurePacketReleaseDigestAckLedgerExceptionLogPanelProps = {
  exceptionLogRecord: ClosurePacketReleaseDigestAckLedgerExceptionLogRecord;
  exceptionLogDraft: ClosurePacketReleaseDigestAckLedgerExceptionLogDraft;
  onExceptionLogDraftChange: (next: ClosurePacketReleaseDigestAckLedgerExceptionLogDraft) => void;
  onApplyExceptionLog: () => void;
};

function exceptionLogStatusClass(status: ClosurePacketReleaseDigestAckLedgerExceptionLogStatus) {
  if (status === "closed") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "recorded") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogPanel({
  exceptionLogRecord,
  exceptionLogDraft,
  onExceptionLogDraftChange,
  onApplyExceptionLog
}: ClosurePacketReleaseDigestAckLedgerExceptionLogPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log">
      <h3>Acknowledgment Exception Log</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            log {exceptionLogRecord.logId}
            <span className={exceptionLogStatusClass(exceptionLogRecord.status)}>
              {exceptionLogRecord.status}
            </span>
          </p>
          <p className="small">
            owner {exceptionLogRecord.ownerRole}:{exceptionLogRecord.ownerActorId || "-"} / recordedAt{" "}
            {exceptionLogRecord.recordedAt
              ? new Date(exceptionLogRecord.recordedAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">
            closedAt{" "}
            {exceptionLogRecord.closedAt ? new Date(exceptionLogRecord.closedAt).toLocaleString("ko-KR") : "-"}
          </p>
          <p className="small">{exceptionLogRecord.summary || "no acknowledgment exception summary"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Exception Log Status
            <select
              value={exceptionLogDraft.status}
              onChange={(event) =>
                onExceptionLogDraftChange({
                  ...exceptionLogDraft,
                  status: event.target.value as ClosurePacketReleaseDigestAckLedgerExceptionLogStatus
                })
              }
            >
              <option value="pending">pending</option>
              <option value="recorded">recorded</option>
              <option value="closed">closed</option>
            </select>
          </label>
          <label>
            Owner Role
            <select
              value={exceptionLogDraft.ownerRole}
              onChange={(event) =>
                onExceptionLogDraftChange({
                  ...exceptionLogDraft,
                  ownerRole: event.target.value as ReviewHandoffRole
                })
              }
            >
              <option value="payroll_operator">payroll_operator</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            Owner Actor ID
            <input
              value={exceptionLogDraft.ownerActorId}
              onChange={(event) =>
                onExceptionLogDraftChange({
                  ...exceptionLogDraft,
                  ownerActorId: event.target.value
                })
              }
            />
          </label>
          <label>
            Summary
            <textarea
              value={exceptionLogDraft.summary}
              onChange={(event) =>
                onExceptionLogDraftChange({
                  ...exceptionLogDraft,
                  summary: event.target.value
                })
              }
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyExceptionLog}>
          Apply Exception Log
        </button>
      </div>
    </article>
  );
}
