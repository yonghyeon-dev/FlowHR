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
  return (
    <>
      <article className="panel panel-request-feedback" id="request-feedback">
        <h2>요청 상태 피드백</h2>
        <p className="small">최근 출퇴근/휴가 요청 상태와 반려·실패 원인을 한 화면에서 확인합니다.</p>
        <div className="request-filter-row">
          <label>
            상태 필터
            <select value={requestFeedbackStatusFilter} onChange={(event) => onRequestFeedbackStatusFilterChange(event.target.value as RequestStatusFilter)}>
              <option value="all">전체</option>
              <option value="PENDING">대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
              <option value="CANCELED">취소</option>
            </select>
          </label>
        </div>
        {filteredRequestFeedbackRows.length === 0 ? (
          <p className="small muted" style={{ marginTop: 10 }}>
            현재 필터 조건에서 표시할 요청 피드백이 없습니다.
          </p>
        ) : (
          <ul className="simple-list feedback-row-list" aria-label="요청 상태 피드백">
            {filteredRequestFeedbackRows.map((row) => (
              <li key={row.id}>
                <span>
                  <strong>{row.channel === "attendance" ? "출퇴근" : "휴가"}</strong>{" "}
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
            실패 원인 가시화 ({requestFailureCauses.length}건)
          </p>
          <button type="button" className="btn btn-secondary btn-small" onClick={() => onCopyFailureCause(latestFailureCauseMessage)}>
            최근 실패 원인 복사
          </button>
        </div>
        {requestFailureCauses.length === 0 ? (
          <p className="small muted" style={{ marginTop: 10 }}>
            최근 실패/반려 이력이 없습니다.
          </p>
        ) : (
          <ul className="failure-cause-list" aria-label="실패 원인 목록">
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
        <h2>요청 검색/정렬</h2>
        <p className="small">출퇴근/휴가 요청을 통합 목록에서 검색하고, 대기 우선 또는 시간순으로 정렬해 후속 조치 대상을 빠르게 찾습니다.</p>
        <div className="request-search-toolbar">
          <label>
            검색 범위
            <select value={requestSearchScope} onChange={(event) => onRequestSearchScopeChange(event.target.value as RequestSearchScope)}>
              <option value="all">전체</option>
              <option value="request_id">{isKoLocale ? "요청 식별자" : "Request ID"}</option>
              <option value="status">상태</option>
              <option value="content">내용</option>
            </select>
          </label>
          <label className="full">
            검색어
            <input
              value={requestSearchQuery}
              onChange={(event) => onRequestSearchQueryChange(event.target.value)}
              placeholder={isKoLocale ? "예: 대기, REQ-..., 메모/사유" : "e.g. pending, REQ-..., note/reason"}
            />
          </label>
          <label>
            정렬
            <select value={requestSortOption} onChange={(event) => onRequestSortOptionChange(event.target.value as RequestSortOption)}>
              <option value="pending_first">대기 우선</option>
              <option value="latest_desc">최신순</option>
              <option value="oldest_asc">오래된순</option>
              <option value="status">상태순</option>
            </select>
          </label>
          <div className="request-search-actions">
            <button type="button" className="btn btn-secondary btn-small" onClick={onResetRequestSearchFilters}>
              필터 초기화
            </button>
            <button type="button" className="btn btn-secondary btn-small" onClick={onOpenPendingRequestSearch}>
              대기만 보기
            </button>
          </div>
        </div>
        {filteredRequestSearchRows.length === 0 ? (
          <p className="small muted">현재 조건에서 표시할 요청이 없습니다.</p>
        ) : (
          <ul className="request-search-list" aria-label="request search and sort list">
            {filteredRequestSearchRows.slice(0, 24).map((row) => (
              <li key={row.key}>
                <div className="request-search-head">
                  <strong>
                    [{row.channel}] {row.requestId}
                  </strong>
                  <span className={`feedback-state-pill state-${statusToTone(row.status)}`}>{toRequestStatusLabel(row.status)}</span>
                </div>
                <p>{row.summary}</p>
                <p className="small muted">{row.detail}</p>
                <div className="request-search-meta">
                  <span className="queue-history-chip">{formatDateTime(row.at)}</span>
                  {row.status === "PENDING" ? (
                    <span className="queue-history-chip">
                      {isKoLocale ? `대기 ${Math.round(row.pendingHours)}시간` : `pending ${Math.round(row.pendingHours)}h`}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel panel-request-timeline" id="request-timeline">
        <h2>모바일 요청 이력 타임라인</h2>
        <p className="small">최근 요청을 시간순으로 보고 채널/상태 기준으로 빠르게 필터링합니다.</p>
        <div className="timeline-filter-grid">
          <label>
            채널
            <select value={timelineChannelFilter} onChange={(event) => onTimelineChannelFilterChange(event.target.value as TimelineChannelFilter)}>
              <option value="all">전체</option>
              <option value="attendance">출퇴근</option>
              <option value="leave">휴가</option>
            </select>
          </label>
          <label>
            상태
            <select value={timelineStatusFilter} onChange={(event) => onTimelineStatusFilterChange(event.target.value as RequestStatusFilter)}>
              <option value="all">전체</option>
              <option value="PENDING">대기</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">반려</option>
              <option value="CANCELED">취소</option>
            </select>
          </label>
        </div>
        {filteredMobileRequestTimeline.length === 0 ? (
          <p className="small muted">현재 필터 조건에서 표시할 모바일 요청 이력이 없습니다.</p>
        ) : (
          <ul className="mobile-request-timeline-list" aria-label="모바일 요청 이력 타임라인">
            {filteredMobileRequestTimeline.map((item) => (
              <li key={item.id}>
                <div className="timeline-head">
                  <strong>{item.channel === "attendance" ? "출퇴근" : "휴가"}</strong>
                  <span className={`feedback-state-pill state-${statusToTone(item.status)}`}>{toRequestStatusLabel(item.status)}</span>
                </div>
                <p>{item.detail}</p>
                <time>{formatDateTime(item.at)}</time>
              </li>
            ))}
          </ul>
        )}
      </article>
    </>
  );
}
