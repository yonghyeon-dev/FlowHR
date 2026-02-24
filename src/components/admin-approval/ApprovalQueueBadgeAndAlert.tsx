import {
  type QueueBadgeSummary,
  type QueueFocus
} from "./approval-queue-types";

type QueueAlertOverview = {
  totalCritical: number;
  totalWatch: number;
  hottestQueue: QueueBadgeSummary | null;
};

type ApprovalQueueBadgeAndAlertProps = {
  copy: {
    filterAriaLabel: string;
    waiting: string;
    normal: string;
    critical: string;
    watch: string;
    searchResult: string;
    oldest: string;
    selected: string;
    summaryConnector: string;
    alertSummaryAriaLabel: string;
    criticalQueue: string;
    watchQueue: string;
    hottestQueue: string;
    countUnit: string;
  };
  queueBadgeSummaries: QueueBadgeSummary[];
  approvalQueueFocus: QueueFocus;
  queueAlertOverview: QueueAlertOverview;
  onApprovalQueueFocusChange: (focus: QueueFocus) => void;
};

export function ApprovalQueueBadgeAndAlert({
  copy,
  queueBadgeSummaries,
  approvalQueueFocus,
  queueAlertOverview,
  onApprovalQueueFocusChange
}: ApprovalQueueBadgeAndAlertProps) {
  return (
    <>
      <div className="queue-badge-strip" role="tablist" aria-label={copy.filterAriaLabel}>
        {queueBadgeSummaries.map((badge) => (
          <button
            key={badge.focus}
            type="button"
            role="tab"
            aria-selected={approvalQueueFocus === badge.focus}
            className={`queue-badge${approvalQueueFocus === badge.focus ? " active" : ""}`}
            onClick={() => onApprovalQueueFocusChange(badge.focus)}
          >
            <span className="queue-badge-title">{badge.label}</span>
            <span className="queue-badge-count">
              {copy.waiting} {badge.pending}
            </span>
            <span className={`queue-badge-alert alert-${badge.alertLevel}`}>
              {badge.alertLevel === "critical"
                ? `${copy.critical} ${badge.critical}`
                : badge.alertLevel === "watch"
                  ? `${copy.watch} ${badge.watch}`
                  : copy.normal}
            </span>
            <span className="queue-badge-meta">
              {copy.searchResult} {badge.visible}
              {copy.summaryConnector}
              {copy.oldest} {Math.round(badge.oldestHours)}h
              {badge.selected > 0 ? `${copy.summaryConnector}${copy.selected} ${badge.selected}` : ""}
            </span>
          </button>
        ))}
      </div>

      <div className="queue-alert-strip" aria-label={copy.alertSummaryAriaLabel}>
        <article className="queue-alert-card tone-critical">
          <p>{copy.criticalQueue}</p>
          <strong>
            {queueAlertOverview.totalCritical}
            {copy.countUnit}
          </strong>
        </article>
        <article className="queue-alert-card tone-watch">
          <p>{copy.watchQueue}</p>
          <strong>
            {queueAlertOverview.totalWatch}
            {copy.countUnit}
          </strong>
        </article>
        <article className="queue-alert-card tone-hot">
          <p>{copy.hottestQueue}</p>
          <strong>{queueAlertOverview.hottestQueue?.label ?? "-"}</strong>
        </article>
      </div>
    </>
  );
}
