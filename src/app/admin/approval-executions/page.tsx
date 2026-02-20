"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
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
    return "/admin#payroll";
  }
  if (execution.domain === "LEAVE") {
    return "/admin#approvals";
  }
  return "/admin#approvals";
}

function resolveQuickJumpLabel(execution: ApprovalExecutionDto) {
  if (execution.domain === "PAYROLL") {
    return "급여 섹션";
  }
  if (execution.domain === "LEAVE") {
    return "휴가 승인 큐";
  }
  return "근태 승인 큐";
}

function toTargetKey(input: { domain: ApprovalDomain; targetEntityType: string; targetEntityId: string }) {
  return `${input.domain}:${input.targetEntityType}:${input.targetEntityId}`;
}

export default function AdminApprovalExecutionsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");

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

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
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

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

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
          at: new Date().toLocaleString("ko-KR")
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
      "결재 실행 현황 조회",
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
      "결재 단계 로그 조회",
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
      dryRun ? "정체 에스컬레이션 드라이런" : "정체 에스컬레이션 실행",
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
      setStatusMessage(`드라이런 완료: 후보 ${parsed.counts.candidates}건`);
    } else if (parsed.counts.requested > 0) {
      setStatusMessage(`에스컬레이션 전송 완료: ${parsed.counts.requested}건`);
    } else {
      setStatusMessage("에스컬레이션 후보가 없어 전송을 건너뛰었습니다.");
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>결재 실행 현황</h1>
        <p>
          정체된 결재 실행 항목을 우선순위로 확인하고, 임계값을 넘는 항목을 드라이런/실전 에스컬레이션으로 전송합니다.
          {showDevTools ? " 개발 모드에서는 헤더 기반 Actor 컨텍스트를 사용할 수 있습니다." : ""}
        </p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>컨텍스트/필터</h2>
          <label>
            Organization ID
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            Admin Actor ID (Dev fallback)
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            Access Token (optional)
            <input
              placeholder="Bearer token"
              value={accessToken}
              onChange={(event) => setAccessToken(event.target.value)}
            />
          </label>
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
              Domain
              <select value={domain} onChange={(event) => setDomain(event.target.value as ApprovalDomain | "")}> 
                {domainOptions.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "ALL"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              State
              <select value={state} onChange={(event) => setState(event.target.value as ApprovalExecutionState | "")}> 
                {stateOptions.map((option) => (
                  <option key={option || "all"} value={option}>
                    {option || "ALL"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Target Entity Type
              <input
                value={targetEntityType}
                onChange={(event) => setTargetEntityType(event.target.value)}
                placeholder="AttendanceRecord / LeaveRequest / PayrollRun"
              />
            </label>
            <label>
              Target Entity ID
              <input value={targetEntityId} onChange={(event) => setTargetEntityId(event.target.value)} />
            </label>
            <label>
              Execution Limit
              <input type="number" min={1} max={500} value={limit} onChange={(event) => setLimit(event.target.value)} />
            </label>
            <label>
              History Limit
              <input
                type="number"
                min={1}
                max={500}
                value={historyLimit}
                onChange={(event) => setHistoryLimit(event.target.value)}
              />
            </label>
            <label>
              Escalation Channel
              <input
                value={notificationChannel}
                onChange={(event) => setNotificationChannel(event.target.value)}
                placeholder="approval-stalled-queue"
              />
            </label>
          </div>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void loadExecutions()} disabled={!organizationId.trim()}>
              실행 현황 조회
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => void triggerEscalation(true)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              에스컬레이션 드라이런
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void triggerEscalation(false)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              에스컬레이션 실행
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session 오류: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>실행 요약</h2>
          <div className="summary-grid">
            <div className="summary-card">
              <p>전체</p>
              <strong>{summary.total}</strong>
            </div>
            <div className="summary-card">
              <p>진행중</p>
              <strong>{summary.pendingCount}</strong>
            </div>
            <div className="summary-card">
              <p>정체 항목</p>
              <strong>{summary.stalledCount}</strong>
            </div>
            <div className="summary-card">
              <p>급여 진행중</p>
              <strong>{summary.payrollPendingCount}</strong>
            </div>
            <div className="summary-card">
              <p>휴가 진행중</p>
              <strong>{summary.leavePendingCount}</strong>
            </div>
            <div className="summary-card">
              <p>근태 진행중</p>
              <strong>{summary.attendancePendingCount}</strong>
            </div>
          </div>
          <p className="small">
            기준 시각 {formatDateTime(asOfDate.toISOString())} / 정체 기준 {stalledHoursMin || "0"}시간
          </p>
        </article>

        <article className="panel">
          <h2>에스컬레이션 결과</h2>
          {!escalationResult ? (
            <p className="small">아직 에스컬레이션 실행 이력이 없습니다.</p>
          ) : (
            <>
              <ul className="simple-list">
                <li>
                  <span>requestedAt</span>
                  <strong>{formatDateTime(escalationResult.requestedAt)}</strong>
                </li>
                <li>
                  <span>dryRun</span>
                  <strong>{escalationResult.dryRun ? "yes" : "no"}</strong>
                </li>
                <li>
                  <span>candidates / requested</span>
                  <strong>
                    {escalationResult.counts.candidates} / {escalationResult.counts.requested}
                  </strong>
                </li>
                <li>
                  <span>webhook configured</span>
                  <strong>{escalationResult.policy.webhookConfigured ? "yes" : "no"}</strong>
                </li>
                <li>
                  <span>provider</span>
                  <strong>{escalationResult.policy.provider ?? "-"}</strong>
                </li>
                <li>
                  <span>webhook source</span>
                  <strong>{escalationResult.policy.webhookSource ?? "-"}</strong>
                </li>
              </ul>
              <p className="small">
                channel {escalationResult.policy.notificationChannel} / threshold {escalationResult.policy.stalledHoursMin}h / limit {escalationResult.policy.limit}
              </p>
              {escalationResult.items.length > 0 ? (
                <ul className="simple-list">
                  {escalationResult.items.map((item) => (
                    <li key={item.executionId}>
                      <span>
                        <strong>{item.domain}</strong> / {item.targetEntityType}:{item.targetEntityId}
                        <br />
                        <span className="small">
                          stalled {item.stalledHours.toFixed(1)}h / stage {item.currentStageIndex}/{item.totalStages}
                        </span>
                      </span>
                      <span className={item.decision === "REQUESTED" ? "ok" : "muted"}>{item.decision}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </article>

        <article className="panel">
          <h2>실행 상태 ({executions.length})</h2>
          {executions.length === 0 ? (
            <p className="small">조회된 결재 실행 데이터가 없습니다.</p>
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
                        <strong>{execution.domain}</strong>
                        <span className={`state-chip state-${execution.state.toLowerCase()}`}>{execution.state}</span>
                      </span>
                      <span className="muted">
                        {execution.targetEntityType}:{execution.targetEntityId}
                      </span>
                      <span className="muted">
                        stage {getCompletedStages(execution)}/{execution.totalStages} ({progressPercent}%)
                        {execution.state === "PENDING" ? ` / 정체 ${stalledHours.toFixed(1)}h` : ""}
                      </span>
                      <span className="progress-track" aria-hidden>
                        <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </span>
                      <span className="small">
                        updated {formatDateTime(execution.updatedAt)}
                        {execution.completedAt ? ` / completed ${formatDateTime(execution.completedAt)}` : ""}
                      </span>
                      {isStalled ? <span className="stale-chip">정체</span> : null}
                    </button>
                    <div className="row-actions">
                      <Link className="btn btn-secondary btn-small" href={resolveQuickJumpPath(execution)}>
                        {resolveQuickJumpLabel(execution)}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>단계 로그 {selectedExecution ? `(${selectedExecution.targetEntityId})` : ""}</h2>
          {selectedExecution === null ? (
            <p className="small">실행 항목을 선택하면 단계별 처리 로그를 표시합니다.</p>
          ) : stageHistory.length === 0 ? (
            <p className="small">해당 실행의 단계 로그가 없습니다.</p>
          ) : (
            <ul className="simple-list">
              {stageHistory.map((entry) => (
                <li key={entry.id}>
                  <span>
                    <span className={entry.allowed ? "ok" : "fail"}>
                      {entry.allowed ? "ALLOW" : "DENY"} ({entry.resolution})
                    </span>
                    {" / "}stage {entry.stageIndex} ({entry.stageLabel})
                    <br />
                    actor {entry.actorRole}
                    {entry.actorId ? ` (${entry.actorId})` : ""}
                    {" / "}required [{entry.requiredRoles.join(", ")}]
                    <br />
                    <span className="small">evaluated {formatDateTime(entry.evaluatedAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>요청 로그</h2>
          <p className="small">
            총 {stats.total}건 / 성공 {stats.success}건 / 실패 {stats.fail}건
            {pendingLabel ? ` / 진행중: ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">아직 API 호출 이력이 없습니다.</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin/approval-history" className="btn btn-secondary">
              결재 단계 이력
            </Link>
            <Link href="/admin" className="btn btn-secondary">
              관리자 홈
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
