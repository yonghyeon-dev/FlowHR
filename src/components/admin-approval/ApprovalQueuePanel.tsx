"use client";

import { ApprovalQueueSearchSortPanel } from "./ApprovalQueueSearchSortPanel";
import {
  type ApprovalActivity,
  type QueueBadgeSummary,
  type QueueFocus,
  type QueueSearchScope,
  type QueueSearchSortOption,
  type QueueSearchSortRow,
  type QueueSearchSortScope
} from "./approval-queue-types";

type QueueAlertOverview = {
  totalCritical: number;
  totalWatch: number;
  hottestQueue: QueueBadgeSummary | null;
};

type ApprovalQueuePanelProps = {
  queueBadgeSummaries: QueueBadgeSummary[];
  approvalQueueFocus: QueueFocus;
  queueAlertOverview: QueueAlertOverview;
  periodStart: string;
  periodEnd: string;
  approvalQueueSearchScope: QueueSearchScope;
  approvalQueueSearch: string;
  approvalQueueOnlyUrgent: boolean;
  approvalQueueSelectedOnly: boolean;
  attendanceRejectReason: string;
  leaveRejectReason: string;
  activeQueueBadgeSummary: QueueBadgeSummary;
  queueSearchSortScope: QueueSearchSortScope;
  queueSearchSortOption: QueueSearchSortOption;
  queueSearchSortQuery: string;
  filteredQueueSearchSortRows: QueueSearchSortRow[];
  approvalActivities: ApprovalActivity[];
  onRefreshInbox: () => void;
  onApprovalQueueFocusChange: (focus: QueueFocus) => void;
  onPeriodStartChange: (value: string) => void;
  onPeriodEndChange: (value: string) => void;
  onApprovalQueueSearchScopeChange: (value: QueueSearchScope) => void;
  onApprovalQueueSearchChange: (value: string) => void;
  onToggleUrgentOnly: () => void;
  onToggleSelectedOnly: () => void;
  onResetQuickFilters: () => void;
  onAttendanceRejectReasonChange: (value: string) => void;
  onLeaveRejectReasonChange: (value: string) => void;
  onQueueSearchSortScopeChange: (value: QueueSearchSortScope) => void;
  onQueueSearchSortOptionChange: (value: QueueSearchSortOption) => void;
  onQueueSearchSortQueryChange: (value: string) => void;
  onApplyPendingPreset: () => void;
  onApplyUrgentPreset: () => void;
  onResetSearchSortPreset: () => void;
  onClearApprovalActivities: () => void;
};

export function ApprovalQueuePanel({
  queueBadgeSummaries,
  approvalQueueFocus,
  queueAlertOverview,
  periodStart,
  periodEnd,
  approvalQueueSearchScope,
  approvalQueueSearch,
  approvalQueueOnlyUrgent,
  approvalQueueSelectedOnly,
  attendanceRejectReason,
  leaveRejectReason,
  activeQueueBadgeSummary,
  queueSearchSortScope,
  queueSearchSortOption,
  queueSearchSortQuery,
  filteredQueueSearchSortRows,
  approvalActivities,
  onRefreshInbox,
  onApprovalQueueFocusChange,
  onPeriodStartChange,
  onPeriodEndChange,
  onApprovalQueueSearchScopeChange,
  onApprovalQueueSearchChange,
  onToggleUrgentOnly,
  onToggleSelectedOnly,
  onResetQuickFilters,
  onAttendanceRejectReasonChange,
  onLeaveRejectReasonChange,
  onQueueSearchSortScopeChange,
  onQueueSearchSortOptionChange,
  onQueueSearchSortQueryChange,
  onApplyPendingPreset,
  onApplyUrgentPreset,
  onResetSearchSortPreset,
  onClearApprovalActivities
}: ApprovalQueuePanelProps) {
  return (
    <article className="panel" id="approvals">
      <div className="approval-queue-header">
        <div>
          <h2>승인 대기함</h2>
          <p className="small">승인 큐 필터/검색/정렬로 대기열을 빠르게 좁혀 일괄 처리합니다.</p>
        </div>
        <button className="btn btn-primary" onClick={onRefreshInbox}>
          대기함 새로고침
        </button>
      </div>

      <div className="queue-badge-strip" role="tablist" aria-label="승인 큐 필터">
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
            <span className="queue-badge-count">대기 {badge.pending}</span>
            <span className={`queue-badge-alert alert-${badge.alertLevel}`}>
              {badge.alertLevel === "critical" ? `긴급 ${badge.critical}` : badge.alertLevel === "watch" ? `주의 ${badge.watch}` : "정상"}
            </span>
            <span className="queue-badge-meta">
              검색 {badge.visible} / 최장 {Math.round(badge.oldestHours)}h
              {badge.selected > 0 ? ` / 선택 ${badge.selected}` : ""}
            </span>
          </button>
        ))}
      </div>

      <div className="queue-alert-strip" aria-label="승인 큐 알림 요약">
        <article className="queue-alert-card tone-critical">
          <p>긴급 대기</p>
          <strong>{queueAlertOverview.totalCritical}건</strong>
        </article>
        <article className="queue-alert-card tone-watch">
          <p>주의 대기</p>
          <strong>{queueAlertOverview.totalWatch}건</strong>
        </article>
        <article className="queue-alert-card tone-hot">
          <p>최우선 큐</p>
          <strong>{queueAlertOverview.hottestQueue?.label ?? "-"}</strong>
        </article>
      </div>

      <div className="input-grid" style={{ marginTop: 12 }}>
        <label>
          기간 시작
          <input type="datetime-local" value={periodStart} onChange={(event) => onPeriodStartChange(event.target.value)} />
        </label>
        <label>
          기간 종료
          <input type="datetime-local" value={periodEnd} onChange={(event) => onPeriodEndChange(event.target.value)} />
        </label>
        <label>
          검색 범위
          <select
            value={approvalQueueSearchScope}
            onChange={(event) => onApprovalQueueSearchScopeChange(event.target.value as QueueSearchScope)}
          >
            <option value="all">전체 필드</option>
            <option value="employee">직원 ID</option>
            <option value="request_id">요청 ID</option>
            <option value="content">메모/사유</option>
          </select>
        </label>
        <label className="full">
          큐 검색
          <input
            value={approvalQueueSearch}
            onChange={(event) => onApprovalQueueSearchChange(event.target.value)}
            placeholder="직원ID, 요청ID, 상태, 메모/사유 검색"
          />
        </label>
        <div className="queue-toggle-row full" role="group" aria-label="승인 큐 빠른 필터">
          <button type="button" className={`queue-toggle-chip${approvalQueueOnlyUrgent ? " active" : ""}`} onClick={onToggleUrgentOnly}>
            긴급만 보기
          </button>
          <button type="button" className={`queue-toggle-chip${approvalQueueSelectedOnly ? " active" : ""}`} onClick={onToggleSelectedOnly}>
            선택 항목만
          </button>
          <button type="button" className="queue-toggle-chip" onClick={onResetQuickFilters}>
            필터 초기화
          </button>
        </div>
        <label className="full">
          출퇴근 반려 사유 (선택)
          <input
            value={attendanceRejectReason}
            onChange={(event) => onAttendanceRejectReasonChange(event.target.value)}
            placeholder="사유 없이 반려할 수 없게 하고 싶으면 정책에서 필수로 변경하세요."
          />
        </label>
        <label className="full">
          휴가 반려 사유 (필수)
          <input value={leaveRejectReason} onChange={(event) => onLeaveRejectReasonChange(event.target.value)} placeholder="예: 근무 일정 충돌" />
        </label>
      </div>

      <p className="small" style={{ marginTop: 10 }}>
        {activeQueueBadgeSummary.label} 큐: 대기 {activeQueueBadgeSummary.pending}건 / 검색 결과 {activeQueueBadgeSummary.visible}건
        {activeQueueBadgeSummary.selected > 0 ? ` / 선택 ${activeQueueBadgeSummary.selected}건` : ""}
        {" / "}
        {activeQueueBadgeSummary.alertLevel === "critical"
          ? `긴급 ${activeQueueBadgeSummary.critical}건`
          : activeQueueBadgeSummary.alertLevel === "watch"
            ? `주의 ${activeQueueBadgeSummary.watch}건`
            : "정상"}
        {approvalQueueSelectedOnly && activeQueueBadgeSummary.focus !== "payroll" ? " / 선택 필터 ON" : ""}
      </p>
      {approvalQueueSelectedOnly && (approvalQueueFocus === "all" || approvalQueueFocus === "payroll") ? (
        <p className="small muted" style={{ marginTop: 6 }}>
          급여 큐는 선택 필터가 없어 검색 조건만 적용됩니다.
        </p>
      ) : null}

      <ApprovalQueueSearchSortPanel
        queueSearchSortScope={queueSearchSortScope}
        queueSearchSortOption={queueSearchSortOption}
        queueSearchSortQuery={queueSearchSortQuery}
        filteredQueueSearchSortRows={filteredQueueSearchSortRows}
        onQueueSearchSortScopeChange={onQueueSearchSortScopeChange}
        onQueueSearchSortOptionChange={onQueueSearchSortOptionChange}
        onQueueSearchSortQueryChange={onQueueSearchSortQueryChange}
        onApplyPendingPreset={onApplyPendingPreset}
        onApplyUrgentPreset={onApplyUrgentPreset}
        onResetSearchSortPreset={onResetSearchSortPreset}
        onFocusQueue={onApprovalQueueFocusChange}
      />

      <hr className="divider" />
      <div className="actions">
        <p className="small" style={{ margin: 0 }}>
          최근 처리 이력 ({approvalActivities.length}건)
        </p>
        <button
          type="button"
          className="btn btn-secondary btn-small"
          onClick={onClearApprovalActivities}
          disabled={approvalActivities.length === 0}
        >
          이력 초기화
        </button>
      </div>
      {approvalActivities.length === 0 ? (
        <p className="small muted">아직 처리 이력이 없습니다.</p>
      ) : (
        <ul className="simple-list" aria-label="승인 처리 이력">
          {approvalActivities.map((activity) => (
            <li key={activity.id}>
              <span>
                <span className={activity.ok ? "ok" : "fail"}>{activity.ok ? "OK" : "FAIL"}</span>{" "}
                <strong>[{activity.queue}]</strong> {activity.action} · {activity.itemId}{" "}
                <span className="muted">
                  ({activity.status} · {activity.at})
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
