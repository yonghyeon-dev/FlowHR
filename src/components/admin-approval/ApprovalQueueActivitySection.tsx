import {
  type ApprovalActivity,
  type QueueBadgeSummary,
  type QueueFocus
} from "./approval-queue-types";
import { formatApprovalQueueRequestLabel } from "@/lib/product-language";

type ApprovalQueueActivitySectionProps = {
  copy: {
    summaryConnector: string;
    waiting: string;
    countUnit: string;
    searchResult: string;
    selected: string;
    selectedFilterOn: string;
    selectedFilterUnavailable: string;
    recentHistory: string;
    clearHistory: string;
    noHistory: string;
    ok: string;
    fail: string;
  };
  activeQueueBadgeSummary: QueueBadgeSummary;
  activeAlertLabel: string;
  approvalQueueSelectedOnly: boolean;
  approvalQueueFocus: QueueFocus;
  approvalActivities: ApprovalActivity[];
  onClearApprovalActivities: () => void;
};

function detectLocale(copy: ApprovalQueueActivitySectionProps["copy"]) {
  return copy.ok === "성공" ? "ko-KR" : "en-US";
}

export function ApprovalQueueActivitySection({
  copy,
  activeQueueBadgeSummary,
  activeAlertLabel,
  approvalQueueSelectedOnly,
  approvalQueueFocus,
  approvalActivities,
  onClearApprovalActivities
}: ApprovalQueueActivitySectionProps) {
  const locale = detectLocale(copy);

  return (
    <>
      <p className="small" style={{ marginTop: 10 }}>
        {activeQueueBadgeSummary.label}
        {copy.summaryConnector}
        {copy.waiting} {activeQueueBadgeSummary.pending}
        {copy.countUnit}
        {copy.summaryConnector}
        {copy.searchResult} {activeQueueBadgeSummary.visible}
        {copy.countUnit}
        {activeQueueBadgeSummary.selected > 0
          ? `${copy.summaryConnector}${copy.selected} ${activeQueueBadgeSummary.selected}${copy.countUnit}`
          : ""}
        {copy.summaryConnector}
        {activeAlertLabel}
        {approvalQueueSelectedOnly && activeQueueBadgeSummary.focus !== "payroll"
          ? `${copy.summaryConnector}${copy.selectedFilterOn}`
          : ""}
      </p>
      {approvalQueueSelectedOnly && (approvalQueueFocus === "all" || approvalQueueFocus === "payroll") ? (
        <p className="small muted" style={{ marginTop: 6 }}>
          {copy.selectedFilterUnavailable}
        </p>
      ) : null}

      <hr className="divider" />
      <div className="actions">
        <p className="small" style={{ margin: 0 }}>
          {copy.recentHistory} ({approvalActivities.length}
          {copy.countUnit})
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={onClearApprovalActivities}
          disabled={approvalActivities.length === 0}
        >
          {copy.clearHistory}
        </button>
      </div>
      {approvalActivities.length === 0 ? (
        <p className="small muted">{copy.noHistory}</p>
      ) : (
        <ul className="simple-list" aria-label={copy.recentHistory}>
          {approvalActivities.map((activity: ApprovalActivity) => (
            <li key={activity.id}>
              <span>
                <span className={activity.ok ? "ok" : "fail"}>{activity.ok ? copy.ok : copy.fail}</span>{" "}
                <strong>{formatApprovalQueueRequestLabel(activity.queue, locale)}</strong> {activity.action}
                <span className="muted">
                  {" "}
                  ({activity.status}
                  {copy.summaryConnector}
                  {activity.at})
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
