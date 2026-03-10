"use client";

import {
  formatAdminSessionConnectionState,
  formatNotificationChannelLabel,
  formatUserFacingErrorMessage,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

import type {
  ApprovalDomain,
  ApprovalExecutionSort,
  ApprovalExecutionState
} from "@/app/admin/approval-executions/page-types";
import { domainOptions, stateOptions } from "@/app/admin/approval-executions/page-types";

type WorkConditionsPanelProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  organizationId: string;
  adminActorId: string;
  sort: ApprovalExecutionSort;
  stalledHoursMin: string;
  asOfInput: string;
  domain: ApprovalDomain | "";
  state: ApprovalExecutionState | "";
  targetEntityType: string;
  targetEntityId: string;
  limit: string;
  historyLimit: string;
  notificationChannel: string;
  pendingLabel: string | null;
  statusMessage: string;
  supabaseSessionError: string | null;
  toDomainLabel: (value: ApprovalDomain) => string;
  toStateLabel: (value: ApprovalExecutionState) => string;
  setSort: (value: ApprovalExecutionSort) => void;
  setStalledHoursMin: (value: string) => void;
  setAsOfInput: (value: string) => void;
  setDomain: (value: ApprovalDomain | "") => void;
  setState: (value: ApprovalExecutionState | "") => void;
  setTargetEntityType: (value: string) => void;
  setTargetEntityId: (value: string) => void;
  setLimit: (value: string) => void;
  setHistoryLimit: (value: string) => void;
  setNotificationChannel: (value: string) => void;
  onLoadExecutions: () => void;
  onEscalationDryRun: () => void;
  onEscalationDispatch: () => void;
};

export function ApprovalExecutionWorkConditionsPanel(props: WorkConditionsPanelProps) {
  const {
    isKoLocale,
    showDevTools,
    organizationId,
    adminActorId,
    sort,
    stalledHoursMin,
    asOfInput,
    domain,
    state,
    targetEntityType,
    targetEntityId,
    limit,
    historyLimit,
    notificationChannel,
    pendingLabel,
    statusMessage,
    supabaseSessionError,
    toDomainLabel,
    toStateLabel,
    setSort,
    setStalledHoursMin,
    setAsOfInput,
    setDomain,
    setState,
    setTargetEntityType,
    setTargetEntityId,
    setLimit,
    setHistoryLimit,
    setNotificationChannel,
    onLoadExecutions,
    onEscalationDryRun,
    onEscalationDispatch
  } = props;

  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const workspaceStatusLabel = isKoLocale ? "작업 공간 상태" : "Workspace status";
  const adminSessionStatusLabel = isKoLocale ? "관리자 세션 상태" : "Admin session status";

  return (
    <article className="panel">
      <h2>{isKoLocale ? "작업 조건" : "Work conditions"}</h2>
      {showDevTools ? (
        <p className="small muted">
          {workspaceStatusLabel}:{" "}
          <strong>{formatWorkspaceConnectionState(Boolean(organizationId.trim()), runtimeLocale)}</strong> /{" "}
          {adminSessionStatusLabel}:{" "}
          <strong>{formatAdminSessionConnectionState(Boolean(adminActorId.trim()), runtimeLocale)}</strong>
        </p>
      ) : null}
      <div className="input-grid">
        <label>
          {isKoLocale ? "정렬" : "Sort"}
          <select value={sort} onChange={(event) => setSort(event.target.value as ApprovalExecutionSort)}>
            <option value="priority_desc">{isKoLocale ? "우선순위" : "Priority"}</option>
            <option value="updated_desc">{isKoLocale ? "최신 업데이트" : "Recently updated"}</option>
          </select>
        </label>
        <label>
          {isKoLocale ? "정체 기준(시간)" : "Stalled threshold (hours)"}
          <input
            type="number"
            min={0}
            max={24 * 365}
            value={stalledHoursMin}
            onChange={(event) => setStalledHoursMin(event.target.value)}
          />
        </label>
        <label>
          {isKoLocale ? "기준 시각" : "As of"}
          <input type="datetime-local" value={asOfInput} onChange={(event) => setAsOfInput(event.target.value)} />
        </label>
        <label>
          {isKoLocale ? "요청 유형" : "Request type"}
          <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain | "")}>
            {domainOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? toDomainLabel(option) : isKoLocale ? "전체" : "All"}
              </option>
            ))}
          </select>
        </label>
        <label>
          {isKoLocale ? "상태" : "State"}
          <select value={state} onChange={(event) => setState(event.target.value as ApprovalExecutionState | "")}>
            {stateOptions.map((option) => (
              <option key={option || "all"} value={option}>
                {option ? toStateLabel(option) : isKoLocale ? "전체" : "All"}
              </option>
            ))}
          </select>
        </label>
      </div>
      <details className="details">
        <summary>{isKoLocale ? "고급 조건" : "Advanced options"}</summary>
        <div className="input-grid" style={{ marginTop: 12 }}>
          <label>
            {isKoLocale ? "요청 분류" : "Request subtype"}
            <input
              value={targetEntityType}
              onChange={(event) => setTargetEntityType(event.target.value)}
              placeholder={
                isKoLocale
                  ? "예: 출퇴근 정정, 휴가 요청, 급여 승인"
                  : "Attendance correction / Leave request / Payroll approval"
              }
            />
          </label>
          <label>
            {isKoLocale ? "요청 번호" : "Request number"}
            <input
              value={targetEntityId}
              onChange={(event) => setTargetEntityId(event.target.value)}
              placeholder={isKoLocale ? "특정 요청만 확인할 때만 입력" : "Optional request reference"}
            />
          </label>
          <label>
            {isKoLocale ? "실행 조회 개수" : "Execution limit"}
            <input type="number" min={1} max={500} value={limit} onChange={(event) => setLimit(event.target.value)} />
          </label>
          <label>
            {isKoLocale ? "이력 조회 개수" : "History limit"}
            <input
              type="number"
              min={1}
              max={500}
              value={historyLimit}
              onChange={(event) => setHistoryLimit(event.target.value)}
            />
          </label>
          <label>
            {isKoLocale ? "알림 채널" : "Notification channel"}
            <input
              value={notificationChannel}
              onChange={(event) => setNotificationChannel(event.target.value)}
              placeholder={formatNotificationChannelLabel("approval-stalled-queue", "ko-KR")}
            />
          </label>
        </div>
      </details>
      <div className="panel-actions">
        <button className="btn btn-secondary" onClick={onLoadExecutions} disabled={!organizationId.trim()}>
          {isKoLocale ? "실행 현황 조회" : "Load executions"}
        </button>
        <button
          className="btn btn-secondary"
          onClick={onEscalationDryRun}
          disabled={!organizationId.trim() || pendingLabel !== null}
        >
          {isKoLocale ? "에스컬레이션 미리보기" : "Run dry escalation"}
        </button>
        <button
          className="btn btn-primary"
          onClick={onEscalationDispatch}
          disabled={!organizationId.trim() || pendingLabel !== null}
        >
          {isKoLocale ? "에스컬레이션 실행" : "Dispatch escalation"}
        </button>
      </div>
      {statusMessage ? <p className="small">{statusMessage}</p> : null}
      {supabaseSessionError ? (
        <p className="small fail">
          {formatUserFacingErrorMessage(supabaseSessionError, runtimeLocale)}
        </p>
      ) : null}
    </article>
  );
}
