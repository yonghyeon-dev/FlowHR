import type { PreSubmitCheckItem, ResubmitCandidate } from "@/app/employee/page-types";

type BadgeLabels = {
  empty: string;
  applied: string;
};

type PreSubmitStatusLabels = {
  pass: string;
  fail: string;
};

type EmployeeResubmitPanelProps = {
  isKoLocale: boolean;
  selectedResubmitCandidateKey: string;
  resubmitCandidates: ResubmitCandidate[];
  selectedResubmitCandidate: ResubmitCandidate | null;
  lastAppliedResubmitCandidateKey: string;
  resubmitFlowChecks: PreSubmitCheckItem[];
  listBadgeLabels: BadgeLabels;
  preSubmitStatusLabels: PreSubmitStatusLabels;
  toRequestStatusLabel: (status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") => string;
  onSelectedResubmitCandidateKeyChange: (value: string) => void;
  onApplySelectedResubmitCandidate: () => void;
  onApplyLatestResubmitCandidate: () => void;
  onClearResubmitSelection: () => void;
  onApplyResubmitCandidateToDraft: (candidate: ResubmitCandidate) => void;
};

export function EmployeeResubmitPanel({
  isKoLocale,
  selectedResubmitCandidateKey,
  resubmitCandidates,
  selectedResubmitCandidate,
  lastAppliedResubmitCandidateKey,
  resubmitFlowChecks,
  listBadgeLabels,
  preSubmitStatusLabels,
  toRequestStatusLabel,
  onSelectedResubmitCandidateKeyChange,
  onApplySelectedResubmitCandidate,
  onApplyLatestResubmitCandidate,
  onClearResubmitSelection,
  onApplyResubmitCandidateToDraft
}: EmployeeResubmitPanelProps) {
  return (
    <article className="panel panel-request-resubmit" id="request-resubmit">
      <h2>{isKoLocale ? "요청 수정/재제출 흐름" : "Request Resubmit Flow"}</h2>
      <p className="small">
        {isKoLocale
          ? "반려/취소된 요청을 선택해 초안을 폼으로 불러오고, 검증 상태를 확인한 뒤 재제출합니다."
          : "Load rejected/canceled requests into the draft form, verify checks, and resubmit."}
      </p>
      <div className="input-grid">
        <label className="full">
          {isKoLocale ? "재제출 후보" : "Resubmit Candidate"}
          <select value={selectedResubmitCandidateKey} onChange={(event) => onSelectedResubmitCandidateKeyChange(event.target.value)}>
            <option value="">{isKoLocale ? "최신 후보 자동 선택" : "Auto-select latest candidate"}</option>
            {resubmitCandidates.map((candidate) => (
              <option key={candidate.key} value={candidate.key}>
                {candidate.channel === "attendance"
                  ? isKoLocale
                    ? "출퇴근"
                    : "Attendance"
                  : isKoLocale
                    ? "휴가"
                    : "Leave"}{" "}
                / {toRequestStatusLabel(candidate.status)} / {candidate.recordId}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="actions">
        <button className="btn btn-primary btn-small" onClick={onApplySelectedResubmitCandidate}>
          {isKoLocale ? "선택 초안 적용" : "Apply Selected Draft"}
        </button>
        <button className="btn btn-secondary btn-small" onClick={onApplyLatestResubmitCandidate}>
          {isKoLocale ? "최신 반려 불러오기" : "Use Latest Rejected Request"}
        </button>
        <button className="btn btn-secondary btn-small" onClick={onClearResubmitSelection}>
          {isKoLocale ? "재제출 선택 초기화" : "Reset Resubmit Selection"}
        </button>
      </div>
      <div className="pre-submit-check-wrap">
        <p className="small" style={{ margin: "8px 0 0" }}>
          {isKoLocale
            ? `흐름 검증 (${resubmitFlowChecks.filter((check) => check.pass).length}/${resubmitFlowChecks.length} 통과)`
            : `Flow checks (${resubmitFlowChecks.filter((check) => check.pass).length}/${resubmitFlowChecks.length} passed)`}
        </p>
        <ul className="pre-submit-check-list" aria-label={isKoLocale ? "재제출 흐름 검증" : "Resubmit flow checks"}>
          {resubmitFlowChecks.map((check) => (
            <li key={check.id} className={check.pass ? "pass" : "fail"}>
              <strong>{check.pass ? preSubmitStatusLabels.pass : preSubmitStatusLabels.fail}</strong>
              <span>{check.label}</span>
              <p>{check.detail}</p>
            </li>
          ))}
        </ul>
      </div>
      {selectedResubmitCandidate ? (
        <article className="resubmit-detail-card">
          <div className="resubmit-detail-head">
            <strong>
              {selectedResubmitCandidate.channel === "attendance"
                ? isKoLocale
                  ? "출퇴근 재제출"
                  : "Attendance Resubmit"
                : isKoLocale
                  ? "휴가 재제출"
                  : "Leave Resubmit"}
            </strong>
            <span className="feedback-state-pill state-fail">{toRequestStatusLabel(selectedResubmitCandidate.status)}</span>
          </div>
          <p>{selectedResubmitCandidate.summary}</p>
          <p className="small muted">
            {isKoLocale ? "사유" : "Reason"}: {selectedResubmitCandidate.reason}
          </p>
          <p className="small muted">{isKoLocale ? "ID" : "ID"}: {selectedResubmitCandidate.recordId}</p>
        </article>
      ) : (
        <p className="small muted" style={{ marginTop: 10 }}>
          {isKoLocale ? "현재 재제출 후보가 없습니다." : "No resubmit candidate selected."}
        </p>
      )}
      <ul className="resubmit-candidate-list" aria-label={isKoLocale ? "재제출 후보 목록" : "resubmit candidate list"}>
        {resubmitCandidates.length === 0 ? (
          <li>
            <strong>{listBadgeLabels.empty}</strong>
            <span className="muted">{isKoLocale ? "반려/취소 요청이 없습니다." : "No rejected/canceled requests."}</span>
          </li>
        ) : (
          resubmitCandidates.map((candidate) => (
            <li key={candidate.key}>
              <div>
                <strong>
                  {candidate.channel === "attendance"
                    ? isKoLocale
                      ? "출퇴근"
                      : "Attendance"
                    : isKoLocale
                      ? "휴가"
                      : "Leave"}{" "}
                  / {candidate.recordId}
                </strong>
                <p>{candidate.summary}</p>
                <span className="muted">{candidate.reason}</span>
              </div>
              <div className="resubmit-candidate-actions">
                {candidate.key === lastAppliedResubmitCandidateKey ? <span className="resubmit-applied-chip">{listBadgeLabels.applied}</span> : null}
                <button
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    onSelectedResubmitCandidateKeyChange(candidate.key);
                    onApplyResubmitCandidateToDraft(candidate);
                  }}
                >
                  {isKoLocale ? "초안 적용" : "Apply Draft"}
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
}
