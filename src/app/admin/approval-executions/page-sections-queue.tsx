"use client";

import Link from "next/link";
import { useState } from "react";

import {
  formatDateTime,
  getCompletedStages,
  getProgressPercent,
  getStalledHours,
  resolveQuickJumpLabel,
  resolveQuickJumpPath,
  toTargetKey
} from "@/app/admin/approval-executions/page-helpers";
import type {
  ApiLog,
  ApiLogStats,
  ApprovalDomain,
  ApprovalExecutionDto,
  ApprovalExecutionState,
  ApprovalStageHistoryDto
} from "@/app/admin/approval-executions/page-types";
import {
  formatActorRoleLabel,
  formatApprovalEntityTypeLabel,
  formatApprovalStageResolutionLabel
} from "@/lib/product-language";

type ExecutionListPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  executions: ApprovalExecutionDto[];
  selectedTargetKey: string;
  asOfDate: Date;
  stalledHoursThreshold: number;
  toDomainLabel: (value: ApprovalDomain) => string;
  toStateLabel: (value: ApprovalExecutionState) => string;
  pendingLabel: string | null;
  onSelectExecution: (execution: ApprovalExecutionDto) => void;
  onApproveExecution: (execution: ApprovalExecutionDto) => void;
  onRejectExecution: (execution: ApprovalExecutionDto, reason: string) => void;
};

export function ApprovalExecutionListPanel(props: ExecutionListPanelProps) {
  const {
    isKoLocale,
    runtimeLocale,
    executions,
    selectedTargetKey,
    asOfDate,
    stalledHoursThreshold,
    toDomainLabel,
    toStateLabel,
    pendingLabel,
    onSelectExecution,
    onApproveExecution,
    onRejectExecution
  } = props;
  const locale = isKoLocale ? "ko-KR" : "en-US";
  const [rejectTarget, setRejectTarget] = useState<ApprovalExecutionDto | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");

  const actionDisabled = pendingLabel !== null;
  const rejectModalTitle =
    rejectTarget?.domain === "ATTENDANCE"
      ? isKoLocale
        ? "출퇴근 정정 반려"
        : "Reject attendance record"
      : isKoLocale
        ? "휴가 요청 반려"
        : "Reject leave request";
  const rejectModalDescription =
    rejectTarget?.domain === "ATTENDANCE"
      ? isKoLocale
        ? "반려 사유를 입력해야 출퇴근 정정 반려가 진행됩니다."
        : "A reason is required to reject this attendance record."
      : isKoLocale
        ? "반려 사유를 입력해야 휴가 반려가 진행됩니다."
        : "A reason is required to reject this leave request.";

  function openRejectDialog(execution: ApprovalExecutionDto) {
    setRejectTarget(execution);
    setRejectReason("");
    setRejectError("");
  }

  function closeRejectDialog() {
    setRejectTarget(null);
    setRejectReason("");
    setRejectError("");
  }

  function submitReject() {
    if (!rejectTarget) {
      return;
    }
    const normalizedReason = rejectReason.trim();
    if (normalizedReason.length === 0) {
      setRejectError(isKoLocale ? "반려 사유를 입력해 주세요." : "Rejection reason is required.");
      return;
    }
    onRejectExecution(rejectTarget, normalizedReason);
    closeRejectDialog();
  }

  return (
    <article className="panel workspace-section-card">
      <div className="section-heading">
        <div>
          <h2>
            {isKoLocale ? "실행 상태" : "Execution status"} ({executions.length})
          </h2>
          <p className="small muted">
            {isKoLocale
              ? "현재 승인 대기열을 선택하고 승인, 반려, 원본 요청 이동을 바로 처리합니다."
              : "Select the active approval queue item and take approve, reject, or jump actions directly."}
          </p>
        </div>
      </div>
      {executions.length === 0 ? (
        <p className="small">{isKoLocale ? "조회된 결재 실행 데이터가 없습니다." : "No execution data found."}</p>
      ) : (
        <ul className="simple-list">
          {executions.map((execution) => {
            const targetKey = toTargetKey(execution);
            const selected = targetKey === selectedTargetKey;
            const progressPercent = getProgressPercent(execution);
            const stalledHours = getStalledHours(execution, asOfDate);
            const isStalled = execution.state === "PENDING" && stalledHours >= stalledHoursThreshold;
            const canApprove =
              execution.state === "PENDING" &&
              (execution.domain === "LEAVE" ||
                execution.domain === "ATTENDANCE" ||
                execution.domain === "PAYROLL");
            const canReject =
              execution.state === "PENDING" &&
              (execution.domain === "LEAVE" || execution.domain === "ATTENDANCE");

            return (
              <li key={execution.id} className={selected ? "selected-row" : undefined}>
                <button type="button" className="execution-row-btn" onClick={() => onSelectExecution(execution)}>
                  <span className="execution-head">
                    <strong>{toDomainLabel(execution.domain)}</strong>
                    <span className={`state-chip state-${execution.state.toLowerCase()}`}>{toStateLabel(execution.state)}</span>
                  </span>
                  <span className="muted">{formatApprovalEntityTypeLabel(execution.targetEntityType, locale)}</span>
                  <span className="muted">
                    {isKoLocale ? "단계" : "Stage"} {getCompletedStages(execution)}/{execution.totalStages} ({progressPercent}%)
                    {execution.state === "PENDING"
                      ? ` / ${isKoLocale ? "정체" : "Stalled"} ${stalledHours.toFixed(1)}h`
                      : ""}
                  </span>
                  <span className="progress-track" aria-hidden>
                    <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
                  </span>
                  <span className="small">
                    {isKoLocale ? "업데이트" : "Updated"} {formatDateTime(execution.updatedAt, runtimeLocale)}
                    {execution.completedAt
                      ? ` / ${isKoLocale ? "완료" : "Completed"} ${formatDateTime(execution.completedAt, runtimeLocale)}`
                      : ""}
                  </span>
                  {isStalled ? <span className="stale-chip">{isKoLocale ? "정체" : "Stalled"}</span> : null}
                </button>
                <div className="row-actions">
                  {canApprove ? (
                    <button
                      type="button"
                      className="btn btn-primary btn-small"
                      onClick={() => onApproveExecution(execution)}
                      disabled={actionDisabled}
                    >
                      {isKoLocale ? "승인" : "Approve"}
                    </button>
                  ) : null}
                  {canReject ? (
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => openRejectDialog(execution)}
                      disabled={actionDisabled}
                    >
                      {isKoLocale ? "반려" : "Reject"}
                    </button>
                  ) : null}
                  <Link className="btn btn-secondary btn-small" href={resolveQuickJumpPath(execution)}>
                    {resolveQuickJumpLabel(execution, isKoLocale)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {rejectTarget ? (
        <div className="approval-reject-modal-backdrop" role="dialog" aria-modal="true">
          <div className="approval-reject-modal">
            <h3>{rejectModalTitle}</h3>
            <p className="small muted">{rejectModalDescription}</p>
            <p className="small">{formatApprovalEntityTypeLabel(rejectTarget.targetEntityType, locale)}</p>
            <label>
              {isKoLocale ? "반려 사유" : "Rejection reason"}
              <textarea
                value={rejectReason}
                onChange={(event) => {
                  setRejectReason(event.target.value);
                  if (rejectError) {
                    setRejectError("");
                  }
                }}
                rows={3}
                placeholder={isKoLocale ? "반려 사유를 입력하세요." : "Enter the rejection reason."}
                disabled={actionDisabled}
              />
            </label>
            {rejectError ? <p className="small fail">{rejectError}</p> : null}
            <div className="panel-actions">
              <button type="button" className="btn btn-secondary" onClick={closeRejectDialog} disabled={actionDisabled}>
                {isKoLocale ? "취소" : "Cancel"}
              </button>
              <button type="button" className="btn btn-primary" onClick={submitReject} disabled={actionDisabled}>
                {isKoLocale ? "반려 실행" : "Submit rejection"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

type StageHistoryPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  selectedExecution: ApprovalExecutionDto | null;
  stageHistory: ApprovalStageHistoryDto[];
};

export function ApprovalExecutionHistoryPanel({
  isKoLocale,
  runtimeLocale,
  selectedExecution,
  stageHistory
}: StageHistoryPanelProps) {
  const locale = isKoLocale ? "ko-KR" : "en-US";

  return (
    <article className="panel workspace-section-card workspace-note-card">
      <div className="section-heading">
        <div>
          <h2>
            {isKoLocale ? "단계 이력" : "Stage history"}{" "}
            {selectedExecution ? `(${formatApprovalEntityTypeLabel(selectedExecution.targetEntityType, locale)})` : ""}
          </h2>
          <p className="small muted">
            {isKoLocale
              ? "선택한 실행 항목의 단계별 평가 결과와 역할 매칭 이력을 확인합니다."
              : "Inspect stage-level evaluation results and role matches for the selected execution."}
          </p>
        </div>
      </div>
      {selectedExecution === null ? (
        <p className="small">
          {isKoLocale ? "실행 항목을 선택하면 단계별 처리 이력을 보여줍니다." : "Select an execution to view stage history."}
        </p>
      ) : stageHistory.length === 0 ? (
        <p className="small">{isKoLocale ? "해당 실행의 단계 이력이 없습니다." : "No stage history for this execution."}</p>
      ) : (
        <ul className="simple-list">
          {stageHistory.map((entry) => (
            <li key={entry.id}>
              <span>
                <span className={entry.allowed ? "ok" : "fail"}>
                  {entry.allowed ? (isKoLocale ? "통과" : "Allow") : isKoLocale ? "거절" : "Deny"} (
                  {formatApprovalStageResolutionLabel(entry.resolution, locale)})
                </span>
                {" / "}
                {isKoLocale ? "단계" : "Stage"} {entry.stageIndex} ({entry.stageLabel})
                <br />
                {isKoLocale ? "수행 주체" : "Actor"} {formatActorRoleLabel(entry.actorRole, locale)}
                {" / "}
                {isKoLocale ? "필수 역할" : "Required"} [
                {entry.requiredRoles.map((role) => formatActorRoleLabel(role, locale)).join(", ")}]
                <br />
                <span className="small">
                  {isKoLocale ? "평가 시각" : "Evaluated"} {formatDateTime(entry.evaluatedAt, runtimeLocale)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

type LogsPanelProps = {
  isKoLocale: boolean;
  stats: ApiLogStats;
  pendingLabel: string | null;
  logs: ApiLog[];
};

export function ApprovalExecutionLogsPanel({ isKoLocale, stats, pendingLabel, logs }: LogsPanelProps) {
  return (
    <article className="panel workspace-section-card workspace-note-card">
      <div className="section-heading">
        <div>
          <h2>{isKoLocale ? "요청 로그" : "Request logs"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "개발 모드에서만 승인 실행 조회와 액션 요청 이력을 확인합니다."
              : "Inspect approval execution request history in dev mode only."}
          </p>
        </div>
      </div>
      <p className="small">
        {isKoLocale ? "총" : "Total"} {stats.total}
        {isKoLocale ? "건/ 성공" : " / success"} {stats.success}
        {isKoLocale ? "건/ 실패" : " / fail"} {stats.fail}
        {isKoLocale ? "건" : ""}
        {pendingLabel ? ` / ${isKoLocale ? "진행 중" : "Running"}: ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small">{isKoLocale ? "아직 API 호출 이력이 없습니다." : "No API call history yet."}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>
                {log.ok ? (isKoLocale ? "성공" : "OK") : isKoLocale ? "실패" : "Fail"}
              </span>{" "}
              {log.label} / {log.status}
              <time>{log.at}</time>
            </li>
          ))}
        </ul>
      )}
      <div className="panel-actions">
        <Link href="/admin/approval-history" className="btn btn-secondary">
          {isKoLocale ? "결재 단계 이력" : "Approval stage history"}
        </Link>
        <Link href="/admin" className="btn btn-secondary">
          {isKoLocale ? "관리자 허브" : "Admin hub"}
        </Link>
      </div>
    </article>
  );
}

export function ApprovalExecutionRelatedWorkspacesPanel({ isKoLocale }: { isKoLocale: boolean }) {
  return (
    <article className="panel workspace-section-card workspace-note-card">
      <div className="section-heading">
        <div>
          <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
          <p className="small muted">
            {isKoLocale
              ? "결재 단계 이력과 관리자 허브로 이어지는 승인 운영 흐름을 바로 엽니다."
              : "Open the connected approval history workspace and return to the admin hub."}
          </p>
        </div>
      </div>
      <div className="panel-actions">
        <Link href="/admin/approval-history" className="btn btn-secondary">
          {isKoLocale ? "결재 단계 이력" : "Approval stage history"}
        </Link>
        <Link href="/admin" className="btn btn-secondary">
          {isKoLocale ? "관리자 허브" : "Admin hub"}
        </Link>
      </div>
    </article>
  );
}
