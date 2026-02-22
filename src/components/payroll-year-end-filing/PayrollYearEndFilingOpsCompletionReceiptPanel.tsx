import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  CompletionReceiptRecord,
  CompletionReceiptStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest";
import type { ReceiptDraft } from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type CompletionReceiptPanelProps = {
  receiptRecord: CompletionReceiptRecord;
  receiptDraft: ReceiptDraft;
  onReceiptDraftChange: (next: ReceiptDraft) => void;
  onApplyReceipt: () => void;
};

function receiptStatusClass(status: CompletionReceiptStatus) {
  if (status === "verified") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "issued") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsCompletionReceiptPanel({
  receiptRecord,
  receiptDraft,
  onReceiptDraftChange,
  onApplyReceipt
}: CompletionReceiptPanelProps) {
  return (
    <article className="panel" id="filing-alert-completion-receipt">
      <h3>Completion Receipt</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            receipt {receiptRecord.receiptId}
            <span className={receiptStatusClass(receiptRecord.status)}>{receiptRecord.status}</span>
          </p>
          <p className="small">
            issuer {receiptRecord.issuedByRole}:{receiptRecord.issuedByActorId || "-"} / issuedAt{" "}
            {receiptRecord.issuedAt ? new Date(receiptRecord.issuedAt).toLocaleString("ko-KR") : "-"}
          </p>
          <p className="small">
            verifiedAt{" "}
            {receiptRecord.verifiedAt ? new Date(receiptRecord.verifiedAt).toLocaleString("ko-KR") : "-"}
          </p>
          <p className="small">{receiptRecord.note || "no completion receipt note"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Receipt Status
            <select
              value={receiptDraft.status}
              onChange={(event) =>
                onReceiptDraftChange({ ...receiptDraft, status: event.target.value as CompletionReceiptStatus })
              }
            >
              <option value="pending">pending</option>
              <option value="issued">issued</option>
              <option value="verified">verified</option>
            </select>
          </label>
          <label>
            Issued By Role
            <select
              value={receiptDraft.issuedByRole}
              onChange={(event) =>
                onReceiptDraftChange({ ...receiptDraft, issuedByRole: event.target.value as ReviewHandoffRole })
              }
            >
              <option value="payroll_operator">payroll_operator</option>
              <option value="manager">manager</option>
              <option value="admin">admin</option>
            </select>
          </label>
          <label>
            Issued By Actor ID
            <input
              value={receiptDraft.issuedByActorId}
              onChange={(event) =>
                onReceiptDraftChange({ ...receiptDraft, issuedByActorId: event.target.value })
              }
            />
          </label>
          <label>
            Note
            <textarea
              value={receiptDraft.note}
              onChange={(event) => onReceiptDraftChange({ ...receiptDraft, note: event.target.value })}
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyReceipt}>
          Apply Completion Receipt
        </button>
      </div>
    </article>
  );
}
