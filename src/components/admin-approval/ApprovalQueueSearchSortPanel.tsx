"use client";

import Link from "next/link";

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
  return (
    <section className="queue-search-sort-panel" id="approval-search-sort">
      <div className="queue-section-head">
        <h3>Approval Queue Search/Sort</h3>
        <p className="small muted">Use one panel to search pending items across queues and re-order triage quickly.</p>
        <p className="small muted">모바일 빠른 승인 액션</p>
      </div>
      <div className="queue-search-sort-controls" aria-label="approval queue search and sort controls">
        <label>
          검색 범위
          <select
            value={queueSearchSortScope}
            onChange={(event) => onQueueSearchSortScopeChange(event.target.value as QueueSearchSortScope)}
          >
            <option value="all">all fields</option>
            <option value="queue">queue</option>
            <option value="employee">employee</option>
            <option value="request_id">request id</option>
            <option value="detail">detail</option>
          </select>
        </label>
        <label>
          Sort
          <select
            value={queueSearchSortOption}
            onChange={(event) => onQueueSearchSortOptionChange(event.target.value as QueueSearchSortOption)}
          >
            <option value="priority_desc">정체 우선순</option>
            <option value="wait_desc">wait time desc</option>
            <option value="recent_desc">recent first</option>
            <option value="employee_asc">employee asc</option>
            <option value="queue_asc">queue asc</option>
          </select>
        </label>
        <label className="full">
          Search query
          <input
            value={queueSearchSortQuery}
            onChange={(event) => onQueueSearchSortQueryChange(event.target.value)}
            placeholder="employee id, request id, state, memo"
          />
        </label>
        <div className="queue-search-sort-actions">
          <button type="button" className="btn btn-secondary btn-small" onClick={onApplyPendingPreset}>
            pending first
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onApplyUrgentPreset}>
            긴급만 보기
          </button>
          <button type="button" className="btn btn-secondary btn-small" onClick={onResetSearchSortPreset}>
            reset
          </button>
        </div>
      </div>
      {filteredQueueSearchSortRows.length === 0 ? (
        <p className="small muted">No rows match current search/sort options.</p>
      ) : (
        <ul className="queue-search-sort-list" aria-label="approval queue search and sort list">
          {filteredQueueSearchSortRows.map((row) => (
            <li key={row.key} className={`severity-${row.severity}${row.selected ? " is-selected" : ""}`}>
              <div className="queue-search-sort-head">
                <strong>
                  [{row.queueLabel}] {row.itemId}
                </strong>
                <span className={`queue-sla-chip level-${row.severity}`}>wait {Math.round(row.waitHours)}h</span>
              </div>
              <p className="small muted">{row.detail}</p>
              <div className="queue-search-sort-meta">
                <span className="queue-history-chip">{row.employeeId}</span>
                <span className="queue-history-chip">severity {row.severity}</span>
                {row.selected ? <span className="queue-history-chip">selected</span> : null}
              </div>
              <div className="queue-search-sort-item-actions">
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onFocusQueue(row.queue)}>
                  focus queue
                </button>
                <Link className="btn btn-secondary btn-small" href="/admin#approvals">
                  open queue
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
