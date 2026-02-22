import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckLedgerRecord,
  ClosurePacketReleaseDigestAckLedgerStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger";
import type { ClosurePacketReleaseDigestAckLedgerDraft } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type ClosurePacketReleaseDigestAckLedgerPanelProps = {
  ackLedgerRecord: ClosurePacketReleaseDigestAckLedgerRecord;
  ackLedgerDraft: ClosurePacketReleaseDigestAckLedgerDraft;
  onAckLedgerDraftChange: (next: ClosurePacketReleaseDigestAckLedgerDraft) => void;
  onApplyAckLedger: () => void;
};

function ackLedgerStatusClass(status: ClosurePacketReleaseDigestAckLedgerStatus) {
  if (status === "verified") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "logged") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerPanel({
  ackLedgerRecord,
  ackLedgerDraft,
  onAckLedgerDraftChange,
  onApplyAckLedger
}: ClosurePacketReleaseDigestAckLedgerPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger">
      <h3>Release Digest Acknowledgment Ledger</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            ledger {ackLedgerRecord.ledgerId}
            <span className={ackLedgerStatusClass(ackLedgerRecord.status)}>{ackLedgerRecord.status}</span>
          </p>
          <p className="small">
            owner {ackLedgerRecord.ownerRole}:{ackLedgerRecord.ownerActorId || "-"} / loggedAt{" "}
            {ackLedgerRecord.loggedAt ? new Date(ackLedgerRecord.loggedAt).toLocaleString("ko-KR") : "-"}
          </p>
          <p className="small">
            verifiedAt{" "}
            {ackLedgerRecord.verifiedAt ? new Date(ackLedgerRecord.verifiedAt).toLocaleString("ko-KR") : "-"}
          </p>
          <p className="small">{ackLedgerRecord.note || "no acknowledgment ledger note"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Ledger Status
            <select
              value={ackLedgerDraft.status}
              onChange={(event) =>
                onAckLedgerDraftChange({
                  ...ackLedgerDraft,
                  status: event.target.value as ClosurePacketReleaseDigestAckLedgerStatus
                })
              }
            >
              <option value="pending">pending</option>
              <option value="logged">logged</option>
              <option value="verified">verified</option>
            </select>
          </label>
          <label>
            Owner Role
            <select
              value={ackLedgerDraft.ownerRole}
              onChange={(event) =>
                onAckLedgerDraftChange({
                  ...ackLedgerDraft,
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
              value={ackLedgerDraft.ownerActorId}
              onChange={(event) =>
                onAckLedgerDraftChange({
                  ...ackLedgerDraft,
                  ownerActorId: event.target.value
                })
              }
            />
          </label>
          <label>
            Note
            <textarea
              value={ackLedgerDraft.note}
              onChange={(event) =>
                onAckLedgerDraftChange({
                  ...ackLedgerDraft,
                  note: event.target.value
                })
              }
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyAckLedger}>
          Apply Acknowledgment Ledger
        </button>
      </div>
    </article>
  );
}
