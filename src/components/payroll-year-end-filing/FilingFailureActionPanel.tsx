import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type { PayrollYearEndFilingFailureState } from "@/components/payroll-year-end-filing/request-feedback-helpers";
import type { FlowLocale } from "@/lib/i18n/locales";

type FilingFailureActionPanelProps = {
  locale: FlowLocale;
  copy: PayrollYearEndFilingCopy;
  failure: PayrollYearEndFilingFailureState;
  disabled: boolean;
  onRetry: () => void;
  onRefreshSubmissions: () => void;
  onLoadPreflightChecklist: () => void;
  onOpenRejectedSubmissions: () => void;
  onLoadAckCatalog: () => void;
  onClear: () => void;
};

const failurePanelCopyByLocale = {
  ko: {
    openPreflightChecklistAction: "\uc0ac\uc804\uc810\uac80 \ubd88\ub7ec\uc624\uae30",
    openRejectedQueueAction: "\uac70\uc808 \uc2e0\uace0 \ud050 \uc5f4\uae30"
  },
  en: {
    openPreflightChecklistAction: "Load Preflight",
    openRejectedQueueAction: "Open Rejected Queue"
  }
} as const;

export default function FilingFailureActionPanel(props: FilingFailureActionPanelProps) {
  const {
    locale,
    copy,
    failure,
    disabled,
    onRetry,
    onRefreshSubmissions,
    onLoadPreflightChecklist,
    onOpenRejectedSubmissions,
    onLoadAckCatalog,
    onClear
  } = props;
  const panelCopy = failurePanelCopyByLocale[locale];
  const isRejectedSubmissionFailure =
    failure.action === "submissions_refresh" ||
    failure.action === "submission_ack" ||
    failure.action === "submission_resubmit" ||
    failure.action === "submission_cancel" ||
    failure.action === "submission_reopen";

  return (
    <article className="panel workspace-section-card workspace-note-card v2-surface-card admin-payroll-recovery-card">
      <p className="eyebrow admin-payroll-recovery-eyebrow">{copy.failureActionPanelEyebrow}</p>
      <h2>{copy.failureActionPanelTitle}</h2>
      <p className="small fail">{failure.message}</p>
      <ul className="simple-list">
        <li>
          <span>{copy.latestFailureActionLabel}</span>
          <strong>{failure.actionLabel}</strong>
        </li>
        <li>
          <span>{copy.latestFailureStatusLabel}</span>
          <strong>{failure.status ?? copy.dashLabel}</strong>
        </li>
        <li>
          <span>{copy.latestFailureAtLabel}</span>
          <strong>{failure.occurredAt}</strong>
        </li>
      </ul>
      <div className="panel-actions">
        <button className="btn btn-secondary" onClick={onRetry} disabled={disabled}>
          {copy.retryFailureAction}
        </button>
        <button className="btn btn-secondary" onClick={onRefreshSubmissions} disabled={disabled}>
          {copy.refreshSubmissionsAction}
        </button>
        {failure.action === "preflight_checklist" ? (
          <button className="btn btn-secondary" onClick={onLoadPreflightChecklist} disabled={disabled}>
            {panelCopy.openPreflightChecklistAction}
          </button>
        ) : null}
        {isRejectedSubmissionFailure ? (
          <button className="btn btn-secondary" onClick={onOpenRejectedSubmissions} disabled={disabled}>
            {panelCopy.openRejectedQueueAction}
          </button>
        ) : null}
        <button className="btn btn-secondary" onClick={onLoadAckCatalog} disabled={disabled}>
          {copy.loadAckCatalogAction}
        </button>
        <button className="btn btn-secondary" onClick={onClear} disabled={disabled}>
          {copy.clearFailureAction}
        </button>
      </div>
    </article>
  );
}
