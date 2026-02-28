"use client";

import Link from "next/link";

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
  ApprovalExecutionSort,
  ApprovalExecutionState,
  ApprovalExecutionSummary,
  ApprovalStageHistoryDto,
  EscalationResultDto
} from "@/app/admin/approval-executions/page-types";
import { domainOptions, stateOptions } from "@/app/admin/approval-executions/page-types";

type WorkConditionsPanelProps = {
  isKoLocale: boolean;
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

  return (
    <article className="panel">
      <h2>{isKoLocale ? "작업 조건" : "Work conditions"}</h2>
      <p className="small muted">
        {isKoLocale ? "조직" : "Organization"}: <code>{organizationId || "-"}</code> /{" "}
        {isKoLocale ? "세션 액터" : "Session actor"}: <code>{adminActorId || "-"}</code>
      </p>
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
          {isKoLocale ? "도메인" : "Domain"}
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
            {isKoLocale ? "대상 엔티티 타입" : "Target entity type"}
            <input
              value={targetEntityType}
              onChange={(event) => setTargetEntityType(event.target.value)}
              placeholder="AttendanceRecord / LeaveRequest / PayrollRun"
            />
          </label>
          <label>
            {isKoLocale ? "대상 엔티티 ID" : "Target entity ID"}
            <input value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)} />
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
            {isKoLocale ? "에스컬레이션 채널" : "Escalation channel"}
            <input
              value={notificationChannel}
              onChange={(event) => setNotificationChannel(event.target.value)}
              placeholder="approval-stalled-queue"
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
          {isKoLocale ? "에스컬레이션 드라이런" : "Run dry escalation"}
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
          {isKoLocale ? "세션 오류" : "Session error"}: {supabaseSessionError}
        </p>
      ) : null}
    </article>
  );
}

type SummaryPanelProps = {
  isKoLocale: boolean;
  summary: ApprovalExecutionSummary;
  asOfIso: string;
  runtimeLocale: string;
  stalledHoursMin: string;
};

export function ApprovalExecutionSummaryPanel({
  isKoLocale,
  summary,
  asOfIso,
  runtimeLocale,
  stalledHoursMin
}: SummaryPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "실행 요약" : "Execution summary"}</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <p>{isKoLocale ? "전체" : "Total"}</p>
          <strong>{summary.total}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "진행중" : "In progress"}</p>
          <strong>{summary.pendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "정체 항목" : "Stalled items"}</p>
          <strong>{summary.stalledCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "급여 진행중" : "Payroll pending"}</p>
          <strong>{summary.payrollPendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "휴가 진행중" : "Leave pending"}</p>
          <strong>{summary.leavePendingCount}</strong>
        </div>
        <div className="summary-card">
          <p>{isKoLocale ? "근태 진행중" : "Attendance pending"}</p>
          <strong>{summary.attendancePendingCount}</strong>
        </div>
      </div>
      <p className="small">
        {isKoLocale ? "기준 시각" : "As of"} {formatDateTime(asOfIso, runtimeLocale)} /{" "}
        {isKoLocale ? "정체 기준" : "Stall threshold"} {stalledHoursMin || "0"}
        {isKoLocale ? "시간" : "h"}
      </p>
    </article>
  );
}

type EscalationResultPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  escalationResult: EscalationResultDto | null;
};

export function ApprovalExecutionEscalationResultPanel({
  isKoLocale,
  runtimeLocale,
  escalationResult
}: EscalationResultPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "에스컬레이션 결과" : "Escalation result"}</h2>
      {!escalationResult ? (
        <p className="small">{isKoLocale ? "아직 에스컬레이션 실행 이력이 없습니다." : "No escalation run yet."}</p>
      ) : (
        <>
          <ul className="simple-list">
            <li>
              <span>{isKoLocale ? "요청 시각" : "requestedAt"}</span>
              <strong>{formatDateTime(escalationResult.requestedAt, runtimeLocale)}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "드라이런" : "dryRun"}</span>
              <strong>{escalationResult.dryRun ? (isKoLocale ? "예" : "yes") : isKoLocale ? "아니오" : "no"}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "후보 / 요청됨" : "candidates / requested"}</span>
              <strong>
                {escalationResult.counts.candidates} / {escalationResult.counts.requested}
              </strong>
            </li>
            <li>
              <span>{isKoLocale ? "웹훅 설정" : "webhook configured"}</span>
              <strong>
                {escalationResult.policy.webhookConfigured ? (isKoLocale ? "예" : "yes") : isKoLocale ? "아니오" : "no"}
              </strong>
            </li>
            <li>
              <span>{isKoLocale ? "제공자" : "provider"}</span>
              <strong>{escalationResult.policy.provider ?? "-"}</strong>
            </li>
            <li>
              <span>{isKoLocale ? "웹훅 소스" : "webhook source"}</span>
              <strong>{escalationResult.policy.webhookSource ?? "-"}</strong>
            </li>
          </ul>
          <p className="small">
            {isKoLocale ? "채널" : "channel"} {escalationResult.policy.notificationChannel} /{" "}
            {isKoLocale ? "임계값" : "threshold"} {escalationResult.policy.stalledHoursMin}h /{" "}
            {isKoLocale ? "제한" : "limit"} {escalationResult.policy.limit}
          </p>
          {escalationResult.items.length > 0 ? (
            <ul className="simple-list">
              {escalationResult.items.map((item) => (
                <li key={item.executionId}>
                  <span>
                    <strong>{item.domain}</strong> / {item.targetEntityType}:{item.targetEntityId}
                    <br />
                    <span className="small">
                      {isKoLocale ? "정체" : "stalled"} {item.stalledHours.toFixed(1)}h /{" "}
                      {isKoLocale ? "단계" : "stage"} {item.currentStageIndex}/{item.totalStages}
                    </span>
                  </span>
                  <span className={item.decision === "REQUESTED" ? "ok" : "muted"}>
                    {item.decision === "REQUESTED"
                      ? isKoLocale
                        ? "요청됨"
                        : "REQUESTED"
                      : isKoLocale
                        ? "드라이런"
                        : "DRY_RUN"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </>
      )}
    </article>
  );
}

type ExecutionListPanelProps = {
  isKoLocale: boolean;
  runtimeLocale: string;
  executions: ApprovalExecutionDto[];
  selectedTargetKey: string;
  asOfDate: Date;
  stalledHoursThreshold: number;
  toDomainLabel: (value: ApprovalDomain) => string;
  toStateLabel: (value: ApprovalExecutionState) => string;
  onSelectExecution: (execution: ApprovalExecutionDto) => void;
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
    onSelectExecution
  } = props;

  return (
    <article className="panel">
      <h2>
        {isKoLocale ? "실행 상태" : "Execution status"} ({executions.length})
      </h2>
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
            return (
              <li key={execution.id} className={selected ? "selected-row" : undefined}>
                <button type="button" className="execution-row-btn" onClick={() => onSelectExecution(execution)}>
                  <span className="execution-head">
                    <strong>{toDomainLabel(execution.domain)}</strong>
                    <span className={`state-chip state-${execution.state.toLowerCase()}`}>{toStateLabel(execution.state)}</span>
                  </span>
                  <span className="muted">
                    {execution.targetEntityType}:{execution.targetEntityId}
                  </span>
                  <span className="muted">
                    {isKoLocale ? "단계" : "stage"} {getCompletedStages(execution)}/{execution.totalStages} ({progressPercent}%)
                    {execution.state === "PENDING"
                      ? ` / ${isKoLocale ? "정체" : "stalled"} ${stalledHours.toFixed(1)}h`
                      : ""}
                  </span>
                  <span className="progress-track" aria-hidden>
                    <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
                  </span>
                  <span className="small">
                    {isKoLocale ? "업데이트" : "updated"} {formatDateTime(execution.updatedAt, runtimeLocale)}
                    {execution.completedAt
                      ? ` / ${isKoLocale ? "완료" : "completed"} ${formatDateTime(execution.completedAt, runtimeLocale)}`
                      : ""}
                  </span>
                  {isStalled ? <span className="stale-chip">{isKoLocale ? "정체" : "Stalled"}</span> : null}
                </button>
                <div className="row-actions">
                  <Link className="btn btn-secondary btn-small" href={resolveQuickJumpPath(execution)}>
                    {resolveQuickJumpLabel(execution, isKoLocale)}
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
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
  return (
    <article className="panel">
      <h2>
        {isKoLocale ? "단계 로그" : "Stage history"} {selectedExecution ? `(${selectedExecution.targetEntityId})` : ""}
      </h2>
      {selectedExecution === null ? (
        <p className="small">
          {isKoLocale ? "실행 항목을 선택하면 단계별 처리 로그를 표시합니다." : "Select an execution to view stage history."}
        </p>
      ) : stageHistory.length === 0 ? (
        <p className="small">{isKoLocale ? "해당 실행의 단계 로그가 없습니다." : "No stage history for this execution."}</p>
      ) : (
        <ul className="simple-list">
          {stageHistory.map((entry) => (
            <li key={entry.id}>
              <span>
                <span className={entry.allowed ? "ok" : "fail"}>
                  {entry.allowed ? (isKoLocale ? "허용" : "ALLOW") : isKoLocale ? "거부" : "DENY"} ({entry.resolution})
                </span>
                {" / "}
                {isKoLocale ? "단계" : "stage"} {entry.stageIndex} ({entry.stageLabel})
                <br />
                {isKoLocale ? "액터" : "actor"} {entry.actorRole}
                {entry.actorId ? ` (${entry.actorId})` : ""}
                {" / "}
                {isKoLocale ? "필요 역할" : "required"} [{entry.requiredRoles.join(", ")}]
                <br />
                <span className="small">
                  {isKoLocale ? "평가 시각" : "evaluated"} {formatDateTime(entry.evaluatedAt, runtimeLocale)}
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
    <article className="panel">
      <h2>{isKoLocale ? "요청 로그" : "Request logs"}</h2>
      <p className="small">
        {isKoLocale ? "총" : "Total"} {stats.total}
        {isKoLocale ? "건 / 성공" : " / success"} {stats.success}
        {isKoLocale ? "건 / 실패" : " / fail"} {stats.fail}
        {isKoLocale ? "건" : ""}
        {pendingLabel ? ` / ${isKoLocale ? "진행중" : "running"}: ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small">{isKoLocale ? "아직 API 호출 이력이 없습니다." : "No API call history yet."}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>
                {log.ok ? (isKoLocale ? "성공" : "OK") : isKoLocale ? "실패" : "FAIL"}
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
          {isKoLocale ? "관리자 홈" : "Admin home"}
        </Link>
      </div>
    </article>
  );
}

export function ApprovalExecutionRelatedWorkspacesPanel({ isKoLocale }: { isKoLocale: boolean }) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "관련 화면 이동" : "Related workspaces"}</h2>
      <div className="panel-actions">
        <Link href="/admin/approval-history" className="btn btn-secondary">
          {isKoLocale ? "결재 단계 이력" : "Approval stage history"}
        </Link>
        <Link href="/admin" className="btn btn-secondary">
          {isKoLocale ? "관리자 홈" : "Admin home"}
        </Link>
      </div>
    </article>
  );
}
