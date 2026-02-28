"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";
type ApprovalExecutionState = "PENDING" | "APPROVED" | "REJECTED";
type ApprovalExecutionSort = "updated_desc" | "priority_desc";
type ApprovalStageResolution =
  | "EXPECTED_ROLE"
  | "ACTIVE_DELEGATION"
  | "PRIVILEGED_BYPASS"
  | "DENIED";

type ApprovalExecutionDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  templateId: string | null;
  state: ApprovalExecutionState;
  totalStages: number;
  currentStageIndex: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApprovalStageHistoryDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stageIndex: number;
  stageLabel: string;
  requiredRoles: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  resolution: ApprovalStageResolution;
  evaluatedAt: string;
};

type EscalationItemDto = {
  executionId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stalledHours: number;
  currentStageIndex: number;
  totalStages: number;
  decision: "REQUESTED" | "DRY_RUN";
};

type EscalationResultDto = {
  requestedAt: string;
  dryRun: boolean;
  policy: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
    webhookConfigured: boolean;
    provider: "discord" | "slack" | null;
    webhookSource: string | null;
  };
  filters: {
    organizationId: string;
    domain: ApprovalDomain | null;
    asOf: string;
  };
  counts: {
    totalPending: number;
    candidates: number;
    requested: number;
    dryRun: number;
    skippedNoCandidate: number;
    failed: number;
  };
  items: EscalationItemDto[];
};

type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

const domainOptions: Array<ApprovalDomain | ""> = ["", "ATTENDANCE", "LEAVE", "PAYROLL"];
const stateOptions: Array<ApprovalExecutionState | ""> = ["", "PENDING", "APPROVED", "REJECTED"];

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(value: string | null, runtimeLocale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

function getCompletedStages(execution: ApprovalExecutionDto) {
  if (execution.totalStages <= 0) {
    return 0;
  }
  if (execution.state === "APPROVED") {
    return execution.totalStages;
  }
  if (execution.state === "REJECTED") {
    return Math.max(1, Math.min(execution.currentStageIndex, execution.totalStages));
  }
  return Math.max(0, Math.min(execution.currentStageIndex - 1, execution.totalStages));
}

function getProgressPercent(execution: ApprovalExecutionDto) {
  if (execution.totalStages <= 0) {
    return 0;
  }
  return Math.round((getCompletedStages(execution) / execution.totalStages) * 100);
}

function getStalledHours(execution: ApprovalExecutionDto, asOf: Date) {
  return Math.max(0, (asOf.getTime() - new Date(execution.updatedAt).getTime()) / (60 * 60 * 1000));
}

function resolveQuickJumpPath(execution: ApprovalExecutionDto) {
  if (execution.domain === "PAYROLL") {
    return "/admin/payroll-year-end";
  }
  if (execution.domain === "LEAVE") {
    return "/admin/leave-accrual";
  }
  return "/admin/attendance-live";
}

function resolveQuickJumpLabel(execution: ApprovalExecutionDto, isKoLocale: boolean) {
  if (execution.domain === "PAYROLL") {
    return isKoLocale ? "급여 워크스페이스" : "Payroll workspace";
  }
  if (execution.domain === "LEAVE") {
    return isKoLocale ? "휴가 워크스페이스" : "Leave workspace";
  }
  return isKoLocale ? "근태 워크스페이스" : "Attendance workspace";
}

function toTargetKey(input: { domain: ApprovalDomain; targetEntityType: string; targetEntityId: string }) {
  return `${input.domain}:${input.targetEntityType}:${input.targetEntityId}`;
}

export default function AdminApprovalExecutionsPage() {
  const [domain, setDomain] = useState<ApprovalDomain | "">("");
  const [state, setState] = useState<ApprovalExecutionState | "">("PENDING");
  const [sort, setSort] = useState<ApprovalExecutionSort>("priority_desc");
  const [stalledHoursMin, setStalledHoursMin] = useState("24");
  const [asOfInput, setAsOfInput] = useState(() => toLocalInputValue(new Date()));
  const [targetEntityType, setTargetEntityType] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [limit, setLimit] = useState("100");
  const [historyLimit, setHistoryLimit] = useState("30");
  const [notificationChannel, setNotificationChannel] = useState("approval-stalled-queue");

  const [executions, setExecutions] = useState<ApprovalExecutionDto[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [stageHistory, setStageHistory] = useState<ApprovalStageHistoryDto[]>([]);
  const [escalationResult, setEscalationResult] = useState<EscalationResultDto | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "ADM-1001").trim() || "ADM-1001";

  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const asOfDate = useMemo(() => {
    const parsed = new Date(asOfInput);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [asOfInput]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const selectedExecution = useMemo(() => {
    return executions.find((item) => toTargetKey(item) === selectedTargetKey) ?? null;
  }, [executions, selectedTargetKey]);

  const summary = useMemo(() => {
    const pending = executions.filter((item) => item.state === "PENDING");
    const threshold = Number(stalledHoursMin || "0");
    const stalled = pending.filter((item) => getStalledHours(item, asOfDate) >= threshold);
    return {
      total: executions.length,
      pendingCount: pending.length,
      stalledCount: stalled.length,
      payrollPendingCount: pending.filter((item) => item.domain === "PAYROLL").length,
      leavePendingCount: pending.filter((item) => item.domain === "LEAVE").length,
      attendancePendingCount: pending.filter((item) => item.domain === "ATTENDANCE").length
    };
  }, [asOfDate, executions, stalledHoursMin]);

  const domainLabel = useMemo(() => {
    return {
      ATTENDANCE: isKoLocale ? "근태" : "Attendance",
      LEAVE: isKoLocale ? "휴가" : "Leave",
      PAYROLL: isKoLocale ? "급여" : "Payroll"
    } as const;
  }, [isKoLocale]);

  const stateLabel = useMemo(() => {
    return {
      PENDING: isKoLocale ? "대기" : "Pending",
      APPROVED: isKoLocale ? "승인" : "Approved",
      REJECTED: isKoLocale ? "반려" : "Rejected"
    } as const;
  }, [isKoLocale]);

  function toDomainLabel(value: ApprovalDomain) {
    return domainLabel[value];
  }

  function toStateLabel(value: ApprovalExecutionState) {
    return stateLabel[value];
  }

  async function callApi(
    label: string,
    method: "GET" | "POST",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          ok: response.ok,
          status: response.status,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }
      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function loadExecutions() {
    if (!organizationId.trim()) {
      return;
    }

    const query = new URLSearchParams({ organizationId: organizationId.trim(), sort });
    if (asOfInput.trim()) {
      query.set("asOf", toIso(asOfInput));
    }
    if (domain) {
      query.set("domain", domain);
    }
    if (state) {
      query.set("state", state);
    }
    if (targetEntityType.trim()) {
      query.set("targetEntityType", targetEntityType.trim());
    }
    if (targetEntityId.trim()) {
      query.set("targetEntityId", targetEntityId.trim());
    }
    if (limit.trim()) {
      query.set("limit", limit.trim());
    }
    if (stalledHoursMin.trim()) {
      query.set("stalledHoursMin", stalledHoursMin.trim());
    }

    const { response, body } = await callApi(
      isKoLocale ? "결재 실행 현황 조회" : "Load approval execution queue",
      "GET",
      `/api/approval/executions?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as { executions?: ApprovalExecutionDto[] };
    const nextExecutions = Array.isArray(parsed.executions) ? parsed.executions : [];
    setExecutions(nextExecutions);

    if (nextExecutions.length === 0) {
      setSelectedTargetKey("");
      setStageHistory([]);
      return;
    }

    const activeKey =
      selectedTargetKey && nextExecutions.some((item) => toTargetKey(item) === selectedTargetKey)
        ? selectedTargetKey
        : toTargetKey(nextExecutions[0]);

    setSelectedTargetKey(activeKey);
    const selected = nextExecutions.find((item) => toTargetKey(item) === activeKey);
    if (selected) {
      await loadStageHistory(selected);
    }
  }

  async function loadStageHistory(execution: ApprovalExecutionDto) {
    if (!organizationId.trim()) {
      return;
    }

    const query = new URLSearchParams({
      organizationId: organizationId.trim(),
      domain: execution.domain,
      targetEntityType: execution.targetEntityType,
      targetEntityId: execution.targetEntityId,
      limit: historyLimit.trim() || "30"
    });

    const { response, body } = await callApi(
      isKoLocale ? "결재 단계 로그 조회" : "Load approval stage history",
      "GET",
      `/api/approval/stage-history?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as { history?: ApprovalStageHistoryDto[] };
    setSelectedTargetKey(toTargetKey(execution));
    setStageHistory(Array.isArray(parsed.history) ? parsed.history : []);
  }

  async function triggerEscalation(dryRun: boolean) {
    if (!organizationId.trim()) {
      return;
    }

    const payload = {
      organizationId: organizationId.trim(),
      domain: domain || undefined,
      stalledHoursMin: stalledHoursMin.trim() ? Number(stalledHoursMin.trim()) : undefined,
      limit: limit.trim() ? Number(limit.trim()) : undefined,
      asOf: asOfInput.trim() ? toIso(asOfInput) : undefined,
      dryRun,
      notificationChannel: notificationChannel.trim() || undefined
    };

    const { response, body } = await callApi(
      dryRun
        ? isKoLocale
          ? "정체 에스컬레이션 드라이런"
          : "Escalation dry run"
        : isKoLocale
          ? "정체 에스컬레이션 실행"
          : "Escalation dispatch",
      "POST",
      "/api/approval/executions/escalate",
      payload
    );

    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as EscalationResultDto;
    setEscalationResult(parsed);
    if (parsed.dryRun) {
      setStatusMessage(
        isKoLocale
          ? `드라이런 완료: 후보 ${parsed.counts.candidates}건`
          : `Dry run complete: ${parsed.counts.candidates} candidate(s)`
      );
    } else if (parsed.counts.requested > 0) {
      setStatusMessage(
        isKoLocale
          ? `에스컬레이션 전송 완료: ${parsed.counts.requested}건`
          : `Escalation sent: ${parsed.counts.requested} item(s)`
      );
    } else {
      setStatusMessage(
        isKoLocale
          ? "에스컬레이션 후보가 없어 전송을 건너뛰었습니다."
          : "No escalation candidate found, dispatch skipped."
      );
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{isKoLocale ? "FlowHR 관리자" : "FlowHR Admin"}</p>
        <h1>{isKoLocale ? "결재 실행 현황" : "Approval execution queue"}</h1>
        <p>
          {isKoLocale
            ? "정체된 결재 실행 항목을 우선순위로 확인하고, 임계값을 넘는 항목을 드라이런/실전 에스컬레이션으로 전송합니다."
            : "Review stalled approval executions by priority and send over-threshold items through dry-run/live escalation."}
          {showDevTools
            ? isKoLocale
              ? " 개발 옵션이 활성화되어 고급 로그를 확인할 수 있습니다."
              : " Dev options are enabled so advanced logs are visible."
            : ""}
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{isKoLocale ? "작업 조건" : "Work conditions"}</h2>
          <p className="small muted">
            {isKoLocale ? "조직" : "Organization"}: <code>{organizationId || "-"}</code> /{" "}
            {isKoLocale ? "세션 액터" : "Session actor"}: <code>{adminActorId || "-"}</code>
          </p>
          <div className="input-grid">
            <label>
              정렬
              <select value={sort} onChange={(event) => setSort(event.target.value as ApprovalExecutionSort)}>
                <option value="priority_desc">우선순위</option>
                <option value="updated_desc">최신 업데이트</option>
              </select>
            </label>
            <label>
              정체 기준(시간)
              <input
                type="number"
                min={0}
                max={24 * 365}
                value={stalledHoursMin}
                onChange={(event) => setStalledHoursMin(event.target.value)}
              />
            </label>
            <label>
              기준 시각
              <input
                type="datetime-local"
                value={asOfInput}
                onChange={(event) => setAsOfInput(event.target.value)}
              />
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
            <button className="btn btn-secondary" onClick={() => void loadExecutions()} disabled={!organizationId.trim()}>
              {isKoLocale ? "실행 현황 조회" : "Load executions"}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void triggerEscalation(true)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              {isKoLocale ? "에스컬레이션 드라이런" : "Run dry escalation"}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void triggerEscalation(false)}
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
            {isKoLocale ? "기준 시각" : "As of"} {formatDateTime(asOfDate.toISOString(), runtimeLocale)} /{" "}
            {isKoLocale ? "정체 기준" : "Stall threshold"} {stalledHoursMin || "0"}
            {isKoLocale ? "시간" : "h"}
          </p>
        </article>

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
                  <strong>{escalationResult.policy.webhookConfigured ? (isKoLocale ? "예" : "yes") : isKoLocale ? "아니오" : "no"}</strong>
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
                const isStalled = execution.state === "PENDING" && stalledHours >= Number(stalledHoursMin || "0");
                return (
                  <li key={execution.id} className={selected ? "selected-row" : undefined}>
                    <button type="button" className="execution-row-btn" onClick={() => void loadStageHistory(execution)}>
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
                      {isStalled ? <span className="stale-chip">정체</span> : null}
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

        <article className="panel">
          <h2>
            {isKoLocale ? "단계 로그" : "Stage history"} {selectedExecution ? `(${selectedExecution.targetEntityId})` : ""}
          </h2>
          {selectedExecution === null ? (
            <p className="small">
              {isKoLocale
                ? "실행 항목을 선택하면 단계별 처리 로그를 표시합니다."
                : "Select an execution to view stage history."}
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

        {showDevTools ? (
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
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? (isKoLocale ? "성공" : "OK") : isKoLocale ? "실패" : "FAIL"}</span>{" "}
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
        ) : (
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
        )}
      </section>
    </main>
  );
}
