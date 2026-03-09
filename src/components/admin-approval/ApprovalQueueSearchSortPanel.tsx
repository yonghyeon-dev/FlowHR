"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useI18n } from "@/lib/i18n/provider";
import {
  formatApprovalQueueRequestLabel,
  formatPublicEmployeeNumber
} from "@/lib/product-language";

import {
  type QueueFocus,
  type QueueSearchSortOption,
  type QueueSearchSortRow,
  type QueueSearchSortScope
} from "./approval-queue-types";

type ApprovalQueueSearchSortPanelProps = {
  queueSearchSortScope: QueueSearchSortScope;
  queueSearchSortOption: QueueSearchSortOption;
  queueSearchSortQuery: string;
  filteredQueueSearchSortRows: QueueSearchSortRow[];
  onQueueSearchSortScopeChange: (value: QueueSearchSortScope) => void;
  onQueueSearchSortOptionChange: (value: QueueSearchSortOption) => void;
  onQueueSearchSortQueryChange: (value: string) => void;
  onApplyPendingPreset: () => void;
  onApplyUrgentPreset: () => void;
  onResetSearchSortPreset: () => void;
  onFocusQueue: (focus: QueueFocus) => void;
};

const searchSortCopyByLocale = {
  ko: {
    title: "승인 큐 검색과 정렬",
    description: "한 화면에서 승인 대기 항목을 찾고 우선순위를 빠르게 정리합니다.",
    mobileHint: "모바일 빠른 검토 흐름에 맞춰 정렬됩니다.",
    controlsAriaLabel: "승인 큐 검색과 정렬 제어",
    scope: "검색 범위",
    scopeAll: "전체 필드",
    scopeQueue: "요청 유형",
    scopeEmployee: "직원",
    scopeRequestId: "요청 번호",
    scopeDetail: "상세 내용",
    sort: "정렬",
    sortPriority: "우선순위 높은 순",
    sortWait: "대기 시간 긴 순",
    sortRecent: "최신 항목 우선",
    sortEmployee: "직원 번호 순",
    sortQueue: "요청 유형 순",
    query: "검색어",
    queryPlaceholder: "직원 번호, 요청 번호, 상태, 메모",
    pendingFirst: "대기 우선",
    urgentOnly: "긴급만 보기",
    reset: "초기화",
    empty: "현재 조건과 일치하는 항목이 없습니다.",
    listAriaLabel: "승인 큐 검색 결과",
    wait: "대기",
    severity: "위험도",
    selected: "선택됨",
    focusQueue: "큐 보기",
    openQueue: "상세 열기",
    summaryVisible: "표시",
    summaryCritical: "긴급",
    summaryWatch: "주의",
    summarySelected: "선택",
    focusCriticalQueue: "긴급 큐 바로가기"
  },
  en: {
    title: "Approval Queue Search/Sort",
    description: "Find pending items in one place and reprioritize triage quickly.",
    mobileHint: "Optimized for mobile quick-review flow.",
    controlsAriaLabel: "approval queue search and sort controls",
    scope: "Scope",
    scopeAll: "all fields",
    scopeQueue: "request type",
    scopeEmployee: "employee",
    scopeRequestId: "request number",
    scopeDetail: "detail",
    sort: "Sort",
    sortPriority: "priority desc",
    sortWait: "wait desc",
    sortRecent: "recent first",
    sortEmployee: "employee asc",
    sortQueue: "queue asc",
    query: "Search",
    queryPlaceholder: "employee number, request id, status, memo",
    pendingFirst: "pending first",
    urgentOnly: "urgent only",
    reset: "reset",
    empty: "No rows match current search/sort options.",
    listAriaLabel: "approval queue search and sort list",
    wait: "wait",
    severity: "severity",
    selected: "selected",
    focusQueue: "focus queue",
    openQueue: "open queue",
    summaryVisible: "visible",
    summaryCritical: "critical",
    summaryWatch: "watch",
    summarySelected: "selected",
    focusCriticalQueue: "focus critical queue"
  }
} as const;

export function ApprovalQueueSearchSortPanel({
  queueSearchSortScope,
  queueSearchSortOption,
  queueSearchSortQuery,
  filteredQueueSearchSortRows,
  onQueueSearchSortScopeChange,
  onQueueSearchSortOptionChange,
  onQueueSearchSortQueryChange,
  onApplyPendingPreset,
  onApplyUrgentPreset,
  onResetSearchSortPreset,
  onFocusQueue
}: ApprovalQueueSearchSortPanelProps) {
  const { locale } = useI18n();
  const copy = searchSortCopyByLocale[locale];
  const summary = useMemo(() => {
    let critical = 0;
    let watch = 0;
    let selected = 0;
    for (const row of filteredQueueSearchSortRows) {
      if (row.severity === "critical") {
        critical += 1;
      } else if (row.severity === "watch") {
        watch += 1;
      }
      if (row.selected) {
        selected += 1;
      }
    }
    return { visible: filteredQueueSearchSortRows.length, critical, watch, selected };
  }, [filteredQueueSearchSortRows]);
  const focusCriticalQueue = useMemo(() => {
    const mutable = { attendance: 0, leave: 0, payroll: 0 };
    for (const row of filteredQueueSearchSortRows) {
      if (row.severity === "critical") {
        mutable[row.queue] += 1;
      }
    }
    const entries: Array<[QueueFocus, number]> = [
      ["attendance", mutable.attendance],
      ["leave", mutable.leave],
      ["payroll", mutable.payroll]
    ];
    const top = entries.sort((left, right) => right[1] - left[1])[0];
    return top && top[1] > 0 ? top[0] : null;
  }, [filteredQueueSearchSortRows]);

  return (
    <section className="queue-search-sort-panel" id="approval-search-sort">
      <div className="queue-section-head">
        <h3>{copy.title}</h3>
        <p className="small muted">{copy.description}</p>
        <p className="small muted">{copy.mobileHint}</p>
      </div>
      <div className="queue-search-sort-controls" aria-label={copy.controlsAriaLabel}>
        <label>
          {copy.scope}
          <select
            value={queueSearchSortScope}
            onChange={(event) => onQueueSearchSortScopeChange(event.target.value as QueueSearchSortScope)}
          >
            <option value="all">{copy.scopeAll}</option>
            <option value="queue">{copy.scopeQueue}</option>
            <option value="employee">{copy.scopeEmployee}</option>
            <option value="request_id">{copy.scopeRequestId}</option>
            <option value="detail">{copy.scopeDetail}</option>
          </select>
        </label>
        <label>
          {copy.sort}
          <select
            value={queueSearchSortOption}
            onChange={(event) => onQueueSearchSortOptionChange(event.target.value as QueueSearchSortOption)}
          >
            <option value="priority_desc">{copy.sortPriority}</option>
            <option value="wait_desc">{copy.sortWait}</option>
            <option value="recent_desc">{copy.sortRecent}</option>
            <option value="employee_asc">{copy.sortEmployee}</option>
            <option value="queue_asc">{copy.sortQueue}</option>
          </select>
        </label>
        <label className="full">
          {copy.query}
          <input
            value={queueSearchSortQuery}
            onChange={(event) => onQueueSearchSortQueryChange(event.target.value)}
            placeholder={copy.queryPlaceholder}
          />
        </label>
        <div className="queue-search-sort-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={onApplyPendingPreset}>
            {copy.pendingFirst}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onApplyUrgentPreset}>
            {copy.urgentOnly}
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onResetSearchSortPreset}>
            {copy.reset}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-small"
            onClick={() => (focusCriticalQueue ? onFocusQueue(focusCriticalQueue) : undefined)}
            disabled={!focusCriticalQueue}
          >
            {copy.focusCriticalQueue}
          </button>
        </div>
      </div>
      <p className="small muted">
        {copy.summaryVisible} {summary.visible} / {copy.summaryCritical} {summary.critical} / {copy.summaryWatch}{" "}
        {summary.watch} / {copy.summarySelected} {summary.selected}
      </p>
      {filteredQueueSearchSortRows.length === 0 ? (
        <p className="small muted">{copy.empty}</p>
      ) : (
        <ul className="queue-search-sort-list" aria-label={copy.listAriaLabel}>
          {filteredQueueSearchSortRows.map((row) => (
            <li key={row.key} className={`severity-${row.severity}${row.selected ? " is-selected" : ""}`}>
              <div className="queue-search-sort-head">
                <strong>
                  {formatApprovalQueueRequestLabel(row.queue, locale)} · {formatPublicEmployeeNumber(row.employeeId)}
                </strong>
                <span className={`queue-sla-chip level-${row.severity}`}>
                  {copy.wait} {Math.round(row.waitHours)}h
                </span>
              </div>
              <p className="small muted">{row.detail}</p>
              <div className="queue-search-sort-meta">
                <span className="queue-history-chip">{formatPublicEmployeeNumber(row.employeeId)}</span>
                <span className="queue-history-chip">
                  {copy.severity} {row.severity}
                </span>
                {row.selected ? <span className="queue-history-chip">{copy.selected}</span> : null}
              </div>
              <div className="queue-search-sort-item-actions">
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onFocusQueue(row.queue)}>
                  {copy.focusQueue}
                </button>
                <Link className="btn btn-secondary btn-small" href="/admin/approval-executions">
                  {copy.openQueue}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
