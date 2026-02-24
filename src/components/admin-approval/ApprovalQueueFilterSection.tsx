import {
  type QueueSearchScope
} from "./approval-queue-types";

type ApprovalQueueFilterSectionProps = {
  copy: {
    periodStart: string;
    periodEnd: string;
    searchScope: string;
    searchScopeAll: string;
    searchScopeEmployee: string;
    searchScopeRequestId: string;
    searchScopeContent: string;
    query: string;
    queryPlaceholder: string;
    filterAriaLabel: string;
    urgentOnly: string;
    selectedOnly: string;
    resetFilter: string;
    attendanceRejectReason: string;
    attendanceRejectReasonPlaceholder: string;
    leaveRejectReason: string;
    leaveRejectReasonPlaceholder: string;
    mobileQuickActions: string;
    pendingFirst: string;
    refreshInbox: string;
  };
  periodStart: string;
  periodEnd: string;
  approvalQueueSearchScope: QueueSearchScope;
  approvalQueueSearch: string;
  approvalQueueOnlyUrgent: boolean;
  approvalQueueSelectedOnly: boolean;
  attendanceRejectReason: string;
  leaveRejectReason: string;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onApprovalQueueSearchScopeChange: (value: QueueSearchScope) => void;
  onApprovalQueueSearchChange: (value: string) => void;
  onToggleUrgentOnly: () => void;
  onToggleSelectedOnly: () => void;
  onResetQuickFilters: () => void;
  onAttendanceRejectReasonChange: (value: string) => void;
  onLeaveRejectReasonChange: (value: string) => void;
  onApplyPendingPreset: () => void;
  onApplyUrgentPreset: () => void;
  onRefreshInbox: () => void;
};

export function ApprovalQueueFilterSection({
  copy,
  periodStart,
  periodEnd,
  approvalQueueSearchScope,
  approvalQueueSearch,
  approvalQueueOnlyUrgent,
  approvalQueueSelectedOnly,
  attendanceRejectReason,
  leaveRejectReason,
  onPeriodStartChange,
  onPeriodEndChange,
  onApprovalQueueSearchScopeChange,
  onApprovalQueueSearchChange,
  onToggleUrgentOnly,
  onToggleSelectedOnly,
  onResetQuickFilters,
  onAttendanceRejectReasonChange,
  onLeaveRejectReasonChange,
  onApplyPendingPreset,
  onApplyUrgentPreset,
  onRefreshInbox
}: ApprovalQueueFilterSectionProps) {
  return (
    <>
      <div className="input-grid" style={{ marginTop: 12 }}>
        <label>
          {copy.periodStart}
          <input type="datetime-local" value={periodStart} onChange={(event) => onPeriodStartChange(event.target.value)} />
        </label>
        <label>
          {copy.periodEnd}
          <input type="datetime-local" value={periodEnd} onChange={(event) => onPeriodEndChange(event.target.value)} />
        </label>
        <label>
          {copy.searchScope}
          <select
            value={approvalQueueSearchScope}
            onChange={(event) => onApprovalQueueSearchScopeChange(event.target.value as QueueSearchScope)}
          >
            <option value="all">{copy.searchScopeAll}</option>
            <option value="employee">{copy.searchScopeEmployee}</option>
            <option value="request_id">{copy.searchScopeRequestId}</option>
            <option value="content">{copy.searchScopeContent}</option>
          </select>
        </label>
        <label className="full">
          {copy.query}
          <input
            value={approvalQueueSearch}
            onChange={(event) => onApprovalQueueSearchChange(event.target.value)}
            placeholder={copy.queryPlaceholder}
          />
        </label>
        <div className="queue-toggle-row full" role="group" aria-label={copy.filterAriaLabel}>
          <button type="button" className={`queue-toggle-chip${approvalQueueOnlyUrgent ? " active" : ""}`} onClick={onToggleUrgentOnly}>
            {copy.urgentOnly}
          </button>
          <button type="button" className={`queue-toggle-chip${approvalQueueSelectedOnly ? " active" : ""}`} onClick={onToggleSelectedOnly}>
            {copy.selectedOnly}
          </button>
          <button type="button" className="queue-toggle-chip" onClick={onResetQuickFilters}>
            {copy.resetFilter}
          </button>
        </div>
        <label className="full">
          {copy.attendanceRejectReason}
          <input
            value={attendanceRejectReason}
            onChange={(event) => onAttendanceRejectReasonChange(event.target.value)}
            placeholder={copy.attendanceRejectReasonPlaceholder}
          />
        </label>
        <label className="full">
          {copy.leaveRejectReason}
          <input
            value={leaveRejectReason}
            onChange={(event) => onLeaveRejectReasonChange(event.target.value)}
            placeholder={copy.leaveRejectReasonPlaceholder}
          />
        </label>
      </div>

      <div className="queue-mobile-sticky" role="region" aria-label={copy.mobileQuickActions}>
        <p>{copy.mobileQuickActions}</p>
        <div className="queue-mobile-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={onApplyUrgentPreset}>
            {copy.urgentOnly}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onApplyPendingPreset}>
            {copy.pendingFirst}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onRefreshInbox}>
            {copy.refreshInbox}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onResetQuickFilters}>
            {copy.resetFilter}
          </button>
        </div>
      </div>
    </>
  );
}
