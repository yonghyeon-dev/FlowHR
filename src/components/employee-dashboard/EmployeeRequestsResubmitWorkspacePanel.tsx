"use client";

import Link from "next/link";

import type { ResubmitCandidate } from "@/app/employee/page-types";

type BadgeLabels = {
  empty: string;
};

type EmployeeRequestsResubmitWorkspacePanelProps = {
  isKoLocale: boolean;
  selectedResubmitCandidateKey: string;
  resubmitCandidates: ResubmitCandidate[];
  selectedResubmitCandidate: ResubmitCandidate | null;
  listBadgeLabels: BadgeLabels;
  toRequestStatusLabel: (status: "REJECTED" | "CANCELED") => string;
  onSelectedResubmitCandidateKeyChange: (value: string) => void;
  resolveDraftHref: (candidate: ResubmitCandidate) => string;
};

export function EmployeeRequestsResubmitWorkspacePanel({
  isKoLocale,
  selectedResubmitCandidateKey,
  resubmitCandidates,
  selectedResubmitCandidate,
  listBadgeLabels,
  toRequestStatusLabel,
  onSelectedResubmitCandidateKeyChange,
  resolveDraftHref
}: EmployeeRequestsResubmitWorkspacePanelProps) {
  const latestCandidate = resubmitCandidates[0] ?? null;

  return (
    <article className="panel panel-request-resubmit" id="resubmit-workbench">
      <h2>{isKoLocale ? "재제출 워크벤치" : "Resubmit workbench"}</h2>
      <p className="small">
        {isKoLocale
          ? "반려되거나 취소된 요청을 검토한 뒤, 적절한 초안으로 다시 이어서 작업합니다."
          : "Review rejected or canceled requests, then continue from the right draft handoff."}
      </p>
      <div className="input-grid">
        <label className="full">
          {isKoLocale ? "재제출 후보" : "Resubmit candidate"}
          <select
            value={selectedResubmitCandidateKey}
            onChange={(event) => onSelectedResubmitCandidateKeyChange(event.target.value)}
          >
            <option value="">
              {isKoLocale ? "최신 후보 자동 선택" : "Auto-select latest candidate"}
            </option>
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
        {selectedResubmitCandidate ? (
          <Link className="btn btn-primary btn-small" href={resolveDraftHref(selectedResubmitCandidate)}>
            {isKoLocale ? "선택 초안 이어서 열기" : "Continue selected draft"}
          </Link>
        ) : null}
        {latestCandidate ? (
          <Link className="btn btn-secondary btn-small" href={resolveDraftHref(latestCandidate)}>
            {isKoLocale ? "최신 반려 이어서 열기" : "Continue latest rejected draft"}
          </Link>
        ) : null}
      </div>
      {selectedResubmitCandidate ? (
        <article className="resubmit-detail-card">
          <div className="resubmit-detail-head">
            <strong>
              {selectedResubmitCandidate.channel === "attendance"
                ? isKoLocale
                  ? "출퇴근 재제출"
                  : "Attendance resubmit"
                : isKoLocale
                  ? "휴가 재제출"
                  : "Leave resubmit"}
            </strong>
            <span className="feedback-state-pill state-fail">
              {toRequestStatusLabel(selectedResubmitCandidate.status)}
            </span>
          </div>
          <p>{selectedResubmitCandidate.summary}</p>
          <p className="small muted">
            {isKoLocale ? "사유" : "Reason"}: {selectedResubmitCandidate.reason}
          </p>
          <p className="small muted">
            {isKoLocale ? "다음 단계" : "Next step"}:{" "}
            {selectedResubmitCandidate.channel === "attendance"
              ? isKoLocale
                ? "정정 폼으로 이어서 이동"
                : "Continue in the correction form"
              : isKoLocale
                ? "휴가 신청 폼으로 이어서 이동"
                : "Continue in the leave request form"}
          </p>
        </article>
      ) : (
        <p className="small muted" style={{ marginTop: 10 }}>
          {isKoLocale
            ? "현재 재제출 후보가 없습니다."
            : "No resubmit candidate selected."}
        </p>
      )}
      <ul
        className="resubmit-candidate-list"
        aria-label={isKoLocale ? "재제출 후보 목록" : "resubmit candidate list"}
      >
        {resubmitCandidates.length === 0 ? (
          <li>
            <strong>{listBadgeLabels.empty}</strong>
            <span className="muted">
              {isKoLocale
                ? "반려/취소 요청이 없습니다."
                : "No rejected/canceled requests."}
            </span>
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
                <Link
                  className="btn btn-secondary btn-small"
                  href={resolveDraftHref(candidate)}
                  onClick={() => onSelectedResubmitCandidateKeyChange(candidate.key)}
                >
                  {isKoLocale ? "초안 이어서 열기" : "Continue draft"}
                </Link>
              </div>
            </li>
          ))
        )}
      </ul>
    </article>
  );
}
