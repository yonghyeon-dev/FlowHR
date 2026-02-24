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
      <h2>요청 수정/재제출 흐름</h2>
      <p className="small">반려/취소된 요청을 선택해 초안을 폼으로 불러오고, 검증 상태를 확인한 뒤 재제출합니다.</p>
      <div className="input-grid">
        <label className="full">
          재제출 후보
          <select value={selectedResubmitCandidateKey} onChange={(event) => onSelectedResubmitCandidateKeyChange(event.target.value)}>
            <option value="">최신 후보 자동 선택</option>
            {resubmitCandidates.map((candidate) => (
              <option key={candidate.key} value={candidate.key}>
                {candidate.channel === "attendance" ? "출퇴근" : "휴가"} / {toRequestStatusLabel(candidate.status)} / {candidate.recordId}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="actions">
        <button className="btn btn-primary btn-small" onClick={onApplySelectedResubmitCandidate}>
          선택 초안 적용
        </button>
        <button className="btn btn-secondary btn-small" onClick={onApplyLatestResubmitCandidate}>
          최신 반려 불러오기
        </button>
        <button className="btn btn-secondary btn-small" onClick={onClearResubmitSelection}>
          재제출 선택 초기화
        </button>
      </div>
      <div className="pre-submit-check-wrap">
        <p className="small" style={{ margin: "8px 0 0" }}>
          흐름 검증 ({resubmitFlowChecks.filter((check) => check.pass).length}/{resubmitFlowChecks.length} 통과)
        </p>
        <ul className="pre-submit-check-list" aria-label="재제출 흐름 검증">
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
            <strong>{selectedResubmitCandidate.channel === "attendance" ? "출퇴근 재제출" : "휴가 재제출"}</strong>
            <span className="feedback-state-pill state-fail">{toRequestStatusLabel(selectedResubmitCandidate.status)}</span>
          </div>
          <p>{selectedResubmitCandidate.summary}</p>
          <p className="small muted">사유: {selectedResubmitCandidate.reason}</p>
          <p className="small muted">ID: {selectedResubmitCandidate.recordId}</p>
        </article>
      ) : (
        <p className="small muted" style={{ marginTop: 10 }}>
          현재 재제출 후보가 없습니다.
        </p>
      )}
      <ul className="resubmit-candidate-list" aria-label={isKoLocale ? "재제출 후보 목록" : "resubmit candidate list"}>
        {resubmitCandidates.length === 0 ? (
          <li>
            <strong>{listBadgeLabels.empty}</strong>
            <span className="muted">반려/취소 요청이 없습니다.</span>
          </li>
        ) : (
          resubmitCandidates.map((candidate) => (
            <li key={candidate.key}>
              <div>
                <strong>
                  {candidate.channel === "attendance" ? "출퇴근" : "휴가"} / {candidate.recordId}
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
                  초안 적용
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
}
