"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";
type ApprovalExecutionState = "PENDING" | "APPROVED" | "REJECTED";
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

function toTargetKey(input: { domain: ApprovalDomain; targetEntityType: string; targetEntityId: string }) {
  return `${input.domain}:${input.targetEntityType}:${input.targetEntityId}`;
}

export default function AdminApprovalExecutionsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");

  const [domain, setDomain] = useState<ApprovalDomain | "">("");
  const [state, setState] = useState<ApprovalExecutionState | "">("PENDING");
  const [targetEntityType, setTargetEntityType] = useState("");
  const [targetEntityId, setTargetEntityId] = useState("");
  const [limit, setLimit] = useState("100");
  const [historyLimit, setHistoryLimit] = useState("30");

  const [executions, setExecutions] = useState<ApprovalExecutionDto[]>([]);
  const [selectedTargetKey, setSelectedTargetKey] = useState("");
  const [stageHistory, setStageHistory] = useState<ApprovalStageHistoryDto[]>([]);
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

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  const selectedExecution = useMemo(() => {
    return executions.find((item) => toTargetKey(item) === selectedTargetKey) ?? null;
  }, [executions, selectedTargetKey]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  async function callApi(label: string, path: string) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, { method: "GET", headers });
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

    const query = new URLSearchParams({ organizationId: organizationId.trim() });
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

    const { response, body } = await callApi(
      "결재 실행 조회",
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
      `/api/approval/stage-history?${query.toString()}`
    );
    if (!response.ok || !body || typeof body !== "object") {
      return;
    }

    const parsed = body as { history?: ApprovalStageHistoryDto[] };
    setSelectedTargetKey(toTargetKey(execution));
    setStageHistory(Array.isArray(parsed.history) ? parsed.history : []);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>결재 실행 현황</h1>
        <p>
          다단계 결재 진행률과 단계별 처리 로그를 한 화면에서 확인합니다.
          {showDevTools ? " 개발 모드에서는 헤더 기반 Actor 컨텍스트를 사용합니다." : ""}
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
              <select
                value={state}
                onChange={(event) => setState(event.target.value as ApprovalExecutionState | "")}
              >
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
          </div>
          <div className="panel-actions">
            <button
              className="btn btn-secondary"
              onClick={() => void loadExecutions()}
              disabled={!organizationId.trim()}
            >
              실행 현황 조회
            </button>
          </div>
          {supabaseSessionError ? <p className="small fail">Session 오류: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>실행 상태 ({executions.length})</h2>
          {executions.length === 0 ? (
            <p className="small">조회된 실행 데이터가 없습니다.</p>
          ) : (
            <ul className="simple-list">
              {executions.map((execution) => {
                const targetKey = toTargetKey(execution);
                const selected = targetKey === selectedTargetKey;
                const progressPercent = getProgressPercent(execution);
                return (
                  <li key={execution.id} className={selected ? "selected-row" : undefined}>
                    <button
                      type="button"
                      className="execution-row-btn"
                      onClick={() => void loadStageHistory(execution)}
                    >
                      <span className="execution-head">
                        <strong>{execution.domain}</strong>
                        <span className={`state-chip state-${execution.state.toLowerCase()}`}>
                          {execution.state}
                        </span>
                      </span>
                      <span className="muted">
                        {execution.targetEntityType}:{execution.targetEntityId}
                      </span>
                      <span className="muted">
                        stage {getCompletedStages(execution)}/{execution.totalStages} ({progressPercent}%)
                      </span>
                      <span className="progress-track" aria-hidden>
                        <span className="progress-fill" style={{ width: `${progressPercent}%` }} />
                      </span>
                      <span className="small">
                        updated {formatDateTime(execution.updatedAt)}
                        {execution.completedAt ? ` / completed ${formatDateTime(execution.completedAt)}` : ""}
                      </span>
                    </button>
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
            <p className="small">해당 실행에 대한 로그가 없습니다.</p>
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
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} /{" "}
                  {log.status}
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
