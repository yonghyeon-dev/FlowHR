import type {
  MobileRequestTimelineItem,
  RequestFailureCause,
  RequestFeedbackRow,
  RequestSearchRow,
  RequestSearchScope,
  RequestSortOption,
  RequestStatusFilter,
  TimelineChannelFilter
} from "@/app/employee/page-types";

type RequestStatusValue = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";

type EmployeeRequestFeedbackPanelsProps = {
  isKoLocale: boolean;
  requestFeedbackStatusFilter: RequestStatusFilter;
  filteredRequestFeedbackRows: RequestFeedbackRow[];
  requestFailureCauses: RequestFailureCause[];
  latestFailureCauseMessage: string;
  requestSearchScope: RequestSearchScope;
  requestSearchQuery: string;
  requestSortOption: RequestSortOption;
  filteredRequestSearchRows: RequestSearchRow[];
  timelineChannelFilter: TimelineChannelFilter;
  timelineStatusFilter: RequestStatusFilter;
  filteredMobileRequestTimeline: MobileRequestTimelineItem[];
  toRequestStatusLabel: (status: RequestStatusValue) => string;
  formatDateTime: (value: string) => string;
  statusToTone: (status: RequestStatusValue) => "ok" | "pending" | "fail";
  onRequestFeedbackStatusFilterChange: (value: RequestStatusFilter) => void;
  onCopyFailureCause: (value: string) => void;
  onRequestSearchScopeChange: (value: RequestSearchScope) => void;
  onRequestSearchQueryChange: (value: string) => void;
  onRequestSortOptionChange: (value: RequestSortOption) => void;
  onResetRequestSearchFilters: () => void;
  onOpenPendingRequestSearch: () => void;
  onTimelineChannelFilterChange: (value: TimelineChannelFilter) => void;
  onTimelineStatusFilterChange: (value: RequestStatusFilter) => void;
};

export function EmployeeRequestFeedbackPanels({
  isKoLocale,
  requestFeedbackStatusFilter,
  filteredRequestFeedbackRows,
  requestFailureCauses,
  latestFailureCauseMessage,
  requestSearchScope,
  requestSearchQuery,
  requestSortOption,
  filteredRequestSearchRows,
  timelineChannelFilter,
  timelineStatusFilter,
  filteredMobileRequestTimeline,
  toRequestStatusLabel,
  formatDateTime,
  statusToTone,
  onRequestFeedbackStatusFilterChange,
  onCopyFailureCause,
  onRequestSearchScopeChange,
  onRequestSearchQueryChange,
  onRequestSortOptionChange,
  onResetRequestSearchFilters,
  onOpenPendingRequestSearch,
  onTimelineChannelFilterChange,
  onTimelineStatusFilterChange
}: EmployeeRequestFeedbackPanelsProps) {
  const pendingSearchRows = filteredRequestSearchRows.filter(
    (row) => row.status === "PENDING"
  );

  return (
    <>
      <section className="employee-request-monitoring-summary-grid">
        <article className="employee-request-monitoring-summary-card">
          <p>{isKoLocale ? "피드백 노출" : "Visible feedback"}</p>
          <strong>{filteredRequestFeedbackRows.length}</strong>
          <span>
            {isKoLocale
              ? "현재 필터에 맞는 요청 상태"
              : "Request states in the active filter"}
          </span>
        </article>
        <article className="employee-request-monitoring-summary-card">
          <p>{isKoLocale ? "대기 후속 조치" : "Pending follow-up"}</p>
          <strong>{pendingSearchRows.length}</strong>
          <span>
            {isKoLocale
              ? "즉시 확인이 필요한 요청"
              : "Requests that still need action"}
          </span>
        </article>
        <article className="employee-request-monitoring-summary-card">
          <p>{isKoLocale ? "실패/반려 원인" : "Failure causes"}</p>
          <strong>{requestFailureCauses.length}</strong>
          <span>
            {isKoLocale
              ? "복사 가능한 최근 원인 포함"
              : "Includes the latest copyable cause"}
          </span>
        </article>
        <article className="employee-request-monitoring-summary-card">
          <p>{isKoLocale ? "타임라인 항목" : "Timeline entries"}</p>
          <strong>{filteredMobileRequestTimeline.length}</strong>
          <span>
            {isKoLocale
              ? "채널/상태 기준으로 재정렬 가능"
              : "Reorderable by channel and status"}
          </span>
        </article>
      </section>

      <article className="panel panel-request-feedback" id="request-feedback">
        <div className="employee-request-monitoring-panel-head">
          <div>
            <h2>{isKoLocale ? "요청 상태 피드백" : "Request Status Feedback"}</h2>
            <p className="small">
              {isKoLocale
                ? "최근 출퇴근/휴가 요청 상태와 반려·실패 원인을 한 화면에서 확인합니다."
                : "Review attendance/leave request statuses and rejection/failure reasons in one place."}
            </p>
          </div>
          <span className="workspace-hero-chip">
            {isKoLocale ? "상태 점검" : "Status review"}
          </span>
        </div>
        <div className="request-filter-row employee-request-monitoring-toolbar">
          <label>
            {isKoLocale ? "상태 필터" : "Status Filter"}
            <select value={requestFeedbackStatusFilter} onChange={(event) => onRequestFeedbackStatusFilterChange(event.target.value as RequestStatusFilter)}>
              <option value="all">{isKoLocale ? "전체" : "All"}</option>
              <option value="PENDING">{isKoLocale ? "대기" : "Pending"}</option>
              <option value="APPROVED">{isKoLocale ? "승인" : "Approved"}</option>
              <option value="REJECTED">{isKoLocale ? "반려" : "Rejected"}</option>
              <option value="CANCELED">{isKoLocale ? "취소" : "Canceled"}</option>
            </select>
          </label>
        </div>
        {filteredRequestFeedbackRows.length === 0 ? (
          <p className="small muted" style={{ marginTop: 10 }}>
            {isKoLocale
              ? "현재 필터 조건에서 표시할 요청 피드백이 없습니다."
              : "No request feedback for the current filter."}
          </p>
        ) : (
          <ul className="simple-list feedback-row-list" aria-label={isKoLocale ? "요청 상태 피드백" : "Request status feedback"}>
            {filteredRequestFeedbackRows.map((row) => (
              <li key={row.id}>
                <span>
                  <strong>
                    {row.channel === "attendance"
                      ? isKoLocale
                        ? "출퇴근"
                        : "Attendance"
                      : isKoLocale
                        ? "휴가"
                        : "Leave"}
                  </strong>{" "}
                  <span className={`feedback-state-pill state-${row.tone}`}>{toRequestStatusLabel(row.status)}</span>
                  <br />
                  <span className="small">{row.message}</span>
                </span>
                <time>{formatDateTime(row.at)}</time>
              </li>
            ))}
          </ul>
        )}
        <hr className="divider" />
        <div className="actions">
          <p className="small" style={{ margin: 0 }}>
            {isKoLocale
              ? `실패 원인 가시화 (${requestFailureCauses.length}건)`
              : `Failure Cause Visibility (${requestFailureCauses.length})`}
          </p>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => onCopyFailureCause(latestFailureCauseMessage)}>
            {isKoLocale ? "최근 실패 원인 복사" : "Copy Latest Failure Cause"}
          </button>
        </div>
        {requestFailureCauses.length === 0 ? (
          <p className="small muted" style={{ marginTop: 10 }}>
            {isKoLocale ? "최근 실패/반려 이력이 없습니다." : "No recent failed/rejected records."}
          </p>
        ) : (
          <ul className="failure-cause-list" aria-label={isKoLocale ? "실패 원인 목록" : "Failure cause list"}>
            {requestFailureCauses.map((cause) => (
              <li key={cause.id}>
                <strong>{cause.source}</strong>
                <p>{cause.message}</p>
                <time>{cause.at}</time>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel panel-request-search-sort" id="request-search-sort">
        <div className="employee-request-monitoring-panel-head">
          <div>
            <h2>{isKoLocale ? "요청 검색/정렬" : "Request Search/Sort"}</h2>
            <p className="small">
              {isKoLocale
                ? "출퇴근/휴가 요청을 통합 목록에서 검색하고, 대기 우선 또는 시간순으로 정렬해 후속 조치 대상을 빠르게 찾습니다."
                : "Search attendance/leave requests and sort by pending priority or time to find follow-up targets quickly."}
            </p>
          </div>
          <span className="workspace-hero-chip">
            {isKoLocale ? "후속 대상 찾기" : "Find follow-up work"}
          </span>
        </div>
        <div className="request-search-toolbar">
          <label>
            {isKoLocale ? "검색 범위" : "Search Scope"}
            <select value={requestSearchScope} onChange={(event) => onRequestSearchScopeChange(event.target.value as RequestSearchScope)}>
              <option value="all">{isKoLocale ? "전체" : "All"}</option>
              <option value="request_id">{isKoLocale ? "요청 식별자" : "Request ID"}</option>
              <option value="status">{isKoLocale ? "상태" : "Status"}</option>
              <option value="content">{isKoLocale ? "내용" : "Content"}</option>
            </select>
          </label>
          <label className="full">
            {isKoLocale ? "검색어" : "Search Query"}
            <input
              value={requestSearchQuery}
              onChange={(event) => onRequestSearchQueryChange(event.target.value)}
              placeholder={isKoLocale ? "예: 대기, REQ-..., 메모/사유" : "e.g. pending, REQ-..., note/reason"}
            />
          </label>
          <label>
            {isKoLocale ? "정렬" : "Sort"}
            <select value={requestSortOption} onChange={(event) => onRequestSortOptionChange(event.target.value as RequestSortOption)}>
              <option value="pending_first">{isKoLocale ? "대기 우선" : "Pending First"}</option>
              <option value="latest_desc">{isKoLocale ? "최신순" : "Latest First"}</option>
              <option value="oldest_asc">{isKoLocale ? "오래된순" : "Oldest First"}</option>
              <option value="status">{isKoLocale ? "상태순" : "By Status"}</option>
            </select>
          </label>
          <div className="request-search-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetRequestSearchFilters}>
              {isKoLocale ? "필터 초기화" : "Reset Filters"}
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={onOpenPendingRequestSearch}>
              {isKoLocale ? "대기만 보기" : "Pending Only"}
            </button>
          </div>
        </div>
        {filteredRequestSearchRows.length === 0 ? (
          <p className="small muted">{isKoLocale ? "현재 조건에서 표시할 요청이 없습니다." : "No request matched current filters."}</p>
        ) : (
          <ul className="request-search-list" aria-label={isKoLocale ? "요청 검색/정렬 목록" : "Request search and sort list"}>
            {filteredRequestSearchRows.slice(0, 24).map((row) => (
              <li key={row.key} className="employee-request-search-card">
                <div className="request-search-head">
                  <div className="employee-request-search-title">
                    <span className="workspace-hero-chip">
                      {row.channel === "attendance"
                        ? isKoLocale
                          ? "출퇴근"
                          : "Attendance"
                        : isKoLocale
                          ? "휴가"
                          : "Leave"}
                    </span>
                    <strong>{row.requestId}</strong>
                  </div>
                  <span className={`feedback-state-pill state-${statusToTone(row.status)}`}>{toRequestStatusLabel(row.status)}</span>
                </div>
                <p className="employee-request-search-summary">{row.summary}</p>
                <p className="small muted employee-request-search-detail">{row.detail}</p>
                <div className="request-search-meta">
                  <span className="queue-history-chip">{formatDateTime(row.at)}</span>
                  {row.status === "PENDING" ? (
                    <span className="queue-history-chip">
                      {isKoLocale ? `대기 ${Math.round(row.pendingHours)}시간` : `Pending ${Math.round(row.pendingHours)}h`}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel panel-request-timeline" id="request-timeline">
        <div className="employee-request-monitoring-panel-head">
          <div>
            <h2>{isKoLocale ? "요청 이력 타임라인" : "Request Timeline"}</h2>
            <p className="small">
              {isKoLocale
                ? "최근 요청을 시간순으로 보고 채널/상태 기준으로 빠르게 필터링합니다."
                : "Review recent requests in time order and filter by channel/status."}
            </p>
          </div>
          <span className="workspace-hero-chip">
            {isKoLocale ? "이력 추적" : "Timeline follow-up"}
          </span>
        </div>
        <div className="timeline-filter-grid">
          <label>
            {isKoLocale ? "채널" : "Channel"}
            <select value={timelineChannelFilter} onChange={(event) => onTimelineChannelFilterChange(event.target.value as TimelineChannelFilter)}>
              <option value="all">{isKoLocale ? "전체" : "All"}</option>
              <option value="attendance">{isKoLocale ? "출퇴근" : "Attendance"}</option>
              <option value="leave">{isKoLocale ? "휴가" : "Leave"}</option>
            </select>
          </label>
          <label>
            {isKoLocale ? "상태" : "Status"}
            <select value={timelineStatusFilter} onChange={(event) => onTimelineStatusFilterChange(event.target.value as RequestStatusFilter)}>
              <option value="all">{isKoLocale ? "전체" : "All"}</option>
              <option value="PENDING">{isKoLocale ? "대기" : "Pending"}</option>
              <option value="APPROVED">{isKoLocale ? "승인" : "Approved"}</option>
              <option value="REJECTED">{isKoLocale ? "반려" : "Rejected"}</option>
              <option value="CANCELED">{isKoLocale ? "취소" : "Canceled"}</option>
            </select>
          </label>
        </div>
        {filteredMobileRequestTimeline.length === 0 ? (
          <p className="small muted">
            {isKoLocale
              ? "현재 필터 조건에서 표시할 요청 이력이 없습니다."
              : "No request history for the current filters."}
          </p>
        ) : (
          <ul className="mobile-request-timeline-list" aria-label={isKoLocale ? "요청 이력 타임라인" : "Request timeline"}>
            {filteredMobileRequestTimeline.map((item) => (
              <li key={item.id} className="employee-request-timeline-card">
                <div className="timeline-head">
                  <div className="employee-request-timeline-title">
                    <span className="workspace-hero-chip">
                      {item.channel === "attendance"
                        ? isKoLocale
                          ? "출퇴근"
                          : "Attendance"
                        : isKoLocale
                          ? "휴가"
                          : "Leave"}
                    </span>
                    <strong>
                      {item.channel === "attendance"
                        ? isKoLocale
                          ? "근태 요청"
                          : "Attendance request"
                        : isKoLocale
                          ? "휴가 요청"
                          : "Leave request"}
                    </strong>
                  </div>
                  <span className={`feedback-state-pill state-${statusToTone(item.status)}`}>{toRequestStatusLabel(item.status)}</span>
                </div>
                <p className="employee-request-timeline-detail">{item.detail}</p>
                <time>{formatDateTime(item.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
