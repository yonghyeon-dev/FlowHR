import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt";
import type { ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptDraft } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type ClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanelProps = {
  closureReceiptRecord: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord;
  closureReceiptDraft: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptDraft;
  onClosureReceiptDraftChange: (
    next: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptDraft
  ) => void;
  onApplyClosureReceipt: () => void;
};

function closureReceiptStatusClass(status: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus) {
  if (status === "verified") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "issued") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanel(
  props: ClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanelProps
) {
  const { closureReceiptRecord, closureReceiptDraft, onClosureReceiptDraftChange, onApplyClosureReceipt } =
    props;

  return (
    <article
      className="panel"
      id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt"
    >
      <h3>Exception Closure Receipt</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            receipt {closureReceiptRecord.receiptId}
            <span className={closureReceiptStatusClass(closureReceiptRecord.status)}>
              {closureReceiptRecord.status}
            </span>
          </p>
          <p className="small">
            owner {closureReceiptRecord.ownerRole}:{closureReceiptRecord.ownerActorId || "-"} / issuedAt{" "}
            {closureReceiptRecord.issuedAt
              ? new Date(closureReceiptRecord.issuedAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">
            verifiedAt{" "}
            {closureReceiptRecord.verifiedAt
              ? new Date(closureReceiptRecord.verifiedAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">{closureReceiptRecord.note || "no exception closure receipt note"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Closure Receipt Status
            <select
              value={closureReceiptDraft.status}
              onChange={(event) =>
                onClosureReceiptDraftChange({
                  ...closureReceiptDraft,
                  status:
                    event.target
                      .value as ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus
                })
              }
            >
              <option value="pending">pending</option>
              <option value="issued">issued</option>
              <option value="verified">verified</option>
            </select>
          </label>
          <label>
            Owner Role
            <select
              value={closureReceiptDraft.ownerRole}
              onChange={(event) =>
                onClosureReceiptDraftChange({
                  ...closureReceiptDraft,
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
              value={closureReceiptDraft.ownerActorId}
              onChange={(event) =>
                onClosureReceiptDraftChange({
                  ...closureReceiptDraft,
                  ownerActorId: event.target.value
                })
              }
            />
          </label>
          <label>
            Note
            <textarea
              value={closureReceiptDraft.note}
              onChange={(event) =>
                onClosureReceiptDraftChange({
                  ...closureReceiptDraft,
                  note: event.target.value
                })
              }
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyClosureReceipt}>
          Apply Closure Receipt
        </button>
      </div>
    </article>
  );
}
