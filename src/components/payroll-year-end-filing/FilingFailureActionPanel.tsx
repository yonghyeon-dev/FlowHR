import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type { PayrollYearEndFilingFailureState } from "@/components/payroll-year-end-filing/request-feedback-helpers";

type FilingFailureActionPanelProps = {
  copy: PayrollYearEndFilingCopy;
  failure: PayrollYearEndFilingFailureState;
  disabled: boolean;
  onRetry: () => void;
  onRefreshSubmissions: () => void;
  onLoadAckCatalog: () => void;
  onClear: () => void;
};

export default function FilingFailureActionPanel(props: FilingFailureActionPanelProps) {
  const {
    copy,
    failure,
    disabled,
    onRetry,
    onRefreshSubmissions,
    onLoadAckCatalog,
    onClear
  } = props;

  return (
    <article className="panel">
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
