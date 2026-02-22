import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  CompletionCloseReportRecord,
  CompletionCloseReportStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report";
import type { CloseReportDraft } from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type CompletionCloseReportPanelProps = {
  closeReportRecord: CompletionCloseReportRecord;
  closeReportDraft: CloseReportDraft;
  onCloseReportDraftChange: (next: CloseReportDraft) => void;
  onApplyCloseReport: () => void;
};

function reportStatusClass(status: CompletionCloseReportStatus) {
  if (status === "published") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "drafted") {
    return `${styles.stateBadge} ${styles.stateIssued}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsCompletionCloseReportPanel({
  closeReportRecord,
  closeReportDraft,
  onCloseReportDraftChange,
  onApplyCloseReport
}: CompletionCloseReportPanelProps) {
  return (
    <article className="panel" id="filing-alert-completion-close-report">
      <h3>Completion Close Report</h3>
      <div className={styles.sectionGrid}>
        <div className={styles.card}>
          <p className="small">
            report {closeReportRecord.reportId}
            <span className={reportStatusClass(closeReportRecord.status)}>{closeReportRecord.status}</span>
          </p>
          <p className="small">
            owner {closeReportRecord.ownerRole}:{closeReportRecord.ownerActorId || "-"} / draftedAt{" "}
            {closeReportRecord.draftedAt ? new Date(closeReportRecord.draftedAt).toLocaleString("ko-KR") : "-"}
          </p>
          <p className="small">
            publishedAt{" "}
            {closeReportRecord.publishedAt
              ? new Date(closeReportRecord.publishedAt).toLocaleString("ko-KR")
              : "-"}
          </p>
          <p className="small">{closeReportRecord.summary || "no close report summary"}</p>
        </div>

        <div className={styles.controlGrid}>
          <label>
            Report Status
            <select
              value={closeReportDraft.status}
              onChange={(event) =>
                onCloseReportDraftChange({
                  ...closeReportDraft,
                  status: event.target.value as CompletionCloseReportStatus
                })
              }
            >
              <option value="pending">pending</option>
              <option value="drafted">drafted</option>
              <option value="published">published</option>
            </select>
          </label>
          <label>
            Owner Role
            <select
              value={closeReportDraft.ownerRole}
              onChange={(event) =>
                onCloseReportDraftChange({
                  ...closeReportDraft,
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
              value={closeReportDraft.ownerActorId}
              onChange={(event) =>
                onCloseReportDraftChange({ ...closeReportDraft, ownerActorId: event.target.value })
              }
            />
          </label>
          <label>
            Summary
            <textarea
              value={closeReportDraft.summary}
              onChange={(event) =>
                onCloseReportDraftChange({ ...closeReportDraft, summary: event.target.value })
              }
            />
          </label>
        </div>

        <button className="btn btn-secondary btn-small" onClick={onApplyCloseReport}>
          Apply Completion Close Report
        </button>
      </div>
    </article>
  );
}
