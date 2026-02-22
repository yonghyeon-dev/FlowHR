import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type {
  CloseReportSignoffEntry,
  CloseReportSignoffStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff";
import {
  CLOSE_REPORT_SIGNOFF_ROLE_LABELS,
  type CloseReportSignoffDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-ui";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type CloseReportSignoffPanelProps = {
  signoffEntries: readonly CloseReportSignoffEntry[];
  signoffDrafts: Record<ReviewHandoffRole, CloseReportSignoffDraft>;
  onSignoffDraftChange: (role: ReviewHandoffRole, next: CloseReportSignoffDraft) => void;
  onApplySignoffRole: (role: ReviewHandoffRole) => void;
};

function signoffStatusClass(status: CloseReportSignoffStatus) {
  if (status === "signed") {
    return `${styles.stateBadge} ${styles.stateVerified}`;
  }
  if (status === "rejected") {
    return `${styles.stateBadge} ${styles.stateHold}`;
  }
  return `${styles.stateBadge} ${styles.statePending}`;
}

export default function PayrollYearEndFilingOpsCloseReportSignoffPanel({
  signoffEntries,
  signoffDrafts,
  onSignoffDraftChange,
  onApplySignoffRole
}: CloseReportSignoffPanelProps) {
  return (
    <article className="panel" id="filing-alert-close-report-signoff">
      <h3>Distribution Sign-off</h3>
      <div className={styles.digestGrid} aria-label="filing close report signoff grid">
        {signoffEntries.map((entry) => {
          const draft = signoffDrafts[entry.role];
          return (
            <div key={entry.role} className={styles.digestRow}>
              <p className="small">
                <strong>{CLOSE_REPORT_SIGNOFF_ROLE_LABELS[entry.role]}</strong>
                <span className={signoffStatusClass(entry.status)}>{entry.status}</span>
              </p>
              <p className="small">
                actor {entry.actorId || "-"} / signedAt{" "}
                {entry.signedAt ? new Date(entry.signedAt).toLocaleString("ko-KR") : "-"}
              </p>
              <p className="small">{entry.note || "no sign-off note"}</p>

              <div className={styles.controlGrid}>
                <label>
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      onSignoffDraftChange(entry.role, {
                        ...draft,
                        status: event.target.value as CloseReportSignoffStatus
                      })
                    }
                  >
                    <option value="pending">pending</option>
                    <option value="signed">signed</option>
                    <option value="rejected">rejected</option>
                  </select>
                </label>
                <label>
                  Actor ID
                  <input
                    value={draft.actorId}
                    onChange={(event) =>
                      onSignoffDraftChange(entry.role, { ...draft, actorId: event.target.value })
                    }
                  />
                </label>
                <label>
                  Note
                  <textarea
                    value={draft.note}
                    onChange={(event) =>
                      onSignoffDraftChange(entry.role, { ...draft, note: event.target.value })
                    }
                  />
                </label>
              </div>

              <button className="btn btn-secondary btn-small" onClick={() => onApplySignoffRole(entry.role)}>
                Apply Sign-off
              </button>
            </div>
          );
        })}
      </div>
    </article>
  );
}
