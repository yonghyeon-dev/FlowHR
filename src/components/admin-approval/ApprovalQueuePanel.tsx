"use client";

import { useMemo } from "react";

import { useI18n } from "@/lib/i18n/provider";

import { ApprovalQueueActivitySection } from "./ApprovalQueueActivitySection";
import { ApprovalQueueBadgeAndAlert } from "./ApprovalQueueBadgeAndAlert";
import { ApprovalQueueFilterSection } from "./ApprovalQueueFilterSection";
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

const queuePanelCopyByLocale = {
  ko: {
    title: "승인 대기함",
    description: "필터/검색/정렬로 대기열을 빠르게 정리하고 즉시 처리합니다.",
    refreshInbox: "대기함 새로고침",
    filterAriaLabel: "승인 큐 필터",
    waiting: "대기",
    normal: "정상",
    critical: "긴급",
    watch: "주의",
    searchResult: "검색",
    oldest: "최장",
    selected: "선택",
    alertSummaryAriaLabel: "승인 큐 알림 요약",
    criticalQueue: "긴급 대기",
    watchQueue: "주의 대기",
    hottestQueue: "최우선 큐",
    countUnit: "건",
    periodStart: "기간 시작",
    periodEnd: "기간 종료",
    searchScope: "검색 범위",
    searchScopeAll: "전체 필드",
    searchScopeEmployee: "직원 번호",
    searchScopeRequestId: "요청 ID",
    searchScopeContent: "메모/사유",
    query: "큐 검색",
    queryPlaceholder: "직원ID, 요청ID, 상태, 메모/사유 검색",
    urgentOnly: "긴급만 보기",
    selectedOnly: "선택 항목만",
    resetFilter: "필터 초기화",
    attendanceRejectReason: "출퇴근 반려 사유 (선택)",
    attendanceRejectReasonPlaceholder: "정책상 반려 사유를 입력하세요.",
    leaveRejectReason: "휴가 반려 사유 (필수)",
    leaveRejectReasonPlaceholder: "예: 근무 일정 충돌",
    mobileQuickActions: "모바일 빠른 처리",
    pendingFirst: "대기 우선",
    summaryConnector: " / ",
    selectedFilterOn: "선택 필터 적용",
    selectedFilterUnavailable: "전체/급여 큐에서는 선택 필터가 적용되지 않습니다.",
    recentHistory: "최근 처리 이력",
    clearHistory: "이력 초기화",
    noHistory: "아직 처리 이력이 없습니다.",
    ok: "성공",
    fail: "실패"
  },
  en: {
    title: "Approval Queue",
    description: "Triage pending items quickly with filters, search, and sorting.",
    refreshInbox: "Refresh queue",
    filterAriaLabel: "approval queue filters",
    waiting: "waiting",
    normal: "normal",
    critical: "critical",
    watch: "watch",
    searchResult: "search",
    oldest: "oldest",
    selected: "selected",
    alertSummaryAriaLabel: "approval queue alert summary",
    criticalQueue: "Critical queue",
    watchQueue: "Watch queue",
    hottestQueue: "Hottest queue",
    countUnit: "items",
    periodStart: "Period start",
    periodEnd: "Period end",
    searchScope: "Search scope",
    searchScopeAll: "All fields",
    searchScopeEmployee: "Employee ID",
    searchScopeRequestId: "Request ID",
    searchScopeContent: "Memo/reason",
    query: "Queue query",
    queryPlaceholder: "Search employee, request ID, status, memo/reason",
    urgentOnly: "Urgent only",
    selectedOnly: "Selected only",
    resetFilter: "Reset filters",
    attendanceRejectReason: "Attendance reject reason (optional)",
    attendanceRejectReasonPlaceholder: "Provide a policy reason before reject.",
    leaveRejectReason: "Leave reject reason (required)",
    leaveRejectReasonPlaceholder: "e.g. schedule conflict",
    mobileQuickActions: "Mobile quick actions",
    pendingFirst: "Pending first",
    summaryConnector: " / ",
    selectedFilterOn: "Selected filter ON",
    selectedFilterUnavailable: "Selected filter is not applied in all/payroll focus.",
    recentHistory: "Recent action history",
    clearHistory: "Clear history",
    noHistory: "No action history yet.",
    ok: "OK",
    fail: "FAIL"
  }
} as const;

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
  const { locale } = useI18n();
  const copy = queuePanelCopyByLocale[locale];

  const activeAlertLabel = useMemo(() => {
    if (activeQueueBadgeSummary.alertLevel === "critical") {
      return `${copy.critical} ${activeQueueBadgeSummary.critical}${copy.countUnit}`;
    }
    if (activeQueueBadgeSummary.alertLevel === "watch") {
      return `${copy.watch} ${activeQueueBadgeSummary.watch}${copy.countUnit}`;
    }
    return copy.normal;
  }, [activeQueueBadgeSummary.alertLevel, activeQueueBadgeSummary.critical, activeQueueBadgeSummary.watch, copy]);

  return (
    <article className="panel" id="approvals">
      <div className="approval-queue-header">
        <div>
          <h2>{copy.title}</h2>
          <p className="small">{copy.description}</p>
        </div>
        <button className="btn btn-primary" onClick={onRefreshInbox}>
          {copy.refreshInbox}
        </button>
      </div>

      <ApprovalQueueBadgeAndAlert
        copy={copy}
        queueBadgeSummaries={queueBadgeSummaries}
        approvalQueueFocus={approvalQueueFocus}
        queueAlertOverview={queueAlertOverview}
        onApprovalQueueFocusChange={onApprovalQueueFocusChange}
      />

      <ApprovalQueueFilterSection
        copy={copy}
        periodStart={periodStart}
        periodEnd={periodEnd}
        approvalQueueSearchScope={approvalQueueSearchScope}
        approvalQueueSearch={approvalQueueSearch}
        approvalQueueOnlyUrgent={approvalQueueOnlyUrgent}
        approvalQueueSelectedOnly={approvalQueueSelectedOnly}
        attendanceRejectReason={attendanceRejectReason}
        leaveRejectReason={leaveRejectReason}
        onPeriodStartChange={onPeriodStartChange}
        onPeriodEndChange={onPeriodEndChange}
        onApprovalQueueSearchScopeChange={onApprovalQueueSearchScopeChange}
        onApprovalQueueSearchChange={onApprovalQueueSearchChange}
        onToggleUrgentOnly={onToggleUrgentOnly}
        onToggleSelectedOnly={onToggleSelectedOnly}
        onResetQuickFilters={onResetQuickFilters}
        onAttendanceRejectReasonChange={onAttendanceRejectReasonChange}
        onLeaveRejectReasonChange={onLeaveRejectReasonChange}
        onApplyPendingPreset={onApplyPendingPreset}
        onApplyUrgentPreset={onApplyUrgentPreset}
        onRefreshInbox={onRefreshInbox}
      />

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

      <ApprovalQueueActivitySection
        copy={copy}
        activeQueueBadgeSummary={activeQueueBadgeSummary}
        activeAlertLabel={activeAlertLabel}
        approvalQueueSelectedOnly={approvalQueueSelectedOnly}
        approvalQueueFocus={approvalQueueFocus}
        approvalActivities={approvalActivities}
        onClearApprovalActivities={onClearApprovalActivities}
      />
    </article>
  );
}
