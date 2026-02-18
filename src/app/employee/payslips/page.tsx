"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type PayrollRunDto = {
  id: string;
  organizationId: string | null;
  employeeId: string | null;
  periodStart: string;
  periodEnd: string;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  confirmedAt: string | null;
};

type AttendanceAggregateDto = {
  employeeId: string;
  counts: {
    payable: number;
  };
  totals: {
    regular: number;
    overtime: number;
    night: number;
    holiday: number;
  };
};

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

function previousMonthRangeLocal() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return {
    start: toLocalInputValue(new Date(year, month, 1, 0, 0, 0)),
    end: toLocalInputValue(new Date(year, month + 1, 0, 23, 59, 0))
  };
}

function lastThreeMonthsRangeLocal() {
  const now = new Date();
  return {
    start: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0)),
    end: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0))
  };
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

function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

function minutesToHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

export default function EmployeePayslipsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [runs, setRuns] = useState<PayrollRunDto[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [aggregate, setAggregate] = useState<AttendanceAggregateDto | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const showDevTools = isDevToolsEnabled();
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
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  const payslipStats = useMemo(() => {
    const totalGross = runs.reduce((sum, run) => sum + run.grossPayKrw, 0);
    const totalDeductions = runs.reduce((sum, run) => sum + (run.totalDeductionsKrw ?? 0), 0);
    const totalNet = runs.reduce((sum, run) => sum + (run.netPayKrw ?? 0), 0);
    return {
      count: runs.length,
      totalGross,
      totalDeductions,
      totalNet
    };
  }, [runs]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );

  useEffect(() => {
    if (runs.length === 0) {
      setSelectedRunId("");
      return;
    }
    if (!runs.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const actorId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim();
    if (actorId.length > 0 && employeeId.trim() !== actorId) {
      setEmployeeId(actorId);
    }
  }, [employeeId, isProductionRuntime, setEmployeeId, supabaseSession?.actorId, supabaseSession?.userId]);

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
        headers.authorization = `Bearer ${bearerToken.trim()}`;
      } else {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        if (organizationId.trim().length > 0) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim().length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR"),
          body
        },
        ...prev
      ]);

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function refreshPayslips() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const targetEmployeeId = employeeId.trim() || "EMP-1001";

    const [runsRes, aggregateRes] = await Promise.all([
      callApi(
        "급여 명세서 조회",
        "GET",
        `/api/payroll/runs${buildQuery({
          from,
          to,
          employeeId: targetEmployeeId,
          state: "CONFIRMED"
        })}`
      ),
      callApi(
        "근태 집계 조회",
        "GET",
        `/api/attendance/aggregates${buildQuery({ from, to, employeeId: targetEmployeeId })}`
      )
    ]);

    if (runsRes.response.ok) {
      const parsed = runsRes.body as { runs?: PayrollRunDto[] };
      setRuns(Array.isArray(parsed.runs) ? parsed.runs : []);
    }

    if (aggregateRes.response.ok) {
      const parsed = aggregateRes.body as { aggregates?: AttendanceAggregateDto[] };
      const aggregates = Array.isArray(parsed.aggregates) ? parsed.aggregates : [];
      setAggregate(aggregates[0] ?? null);
    }
  }

  function applyCurrentMonthRange() {
    setPeriodStart(firstDayOfMonthLocal());
    setPeriodEnd(lastDayOfMonthLocal());
  }

  function applyPreviousMonthRange() {
    const range = previousMonthRangeLocal();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  function applyLastThreeMonthsRange() {
    const range = lastThreeMonthsRangeLocal();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  async function copySelectedRunId() {
    if (!selectedRun) {
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedRun.id);
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "명세서 ID 복사",
          status: 200,
          ok: true,
          at: new Date().toLocaleString("ko-KR"),
          body: { runId: selectedRun.id }
        },
        ...prev
      ]);
    } catch (error) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "명세서 ID 복사",
          status: 500,
          ok: false,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: error instanceof Error ? error.message : String(error) }
        },
        ...prev
      ]);
    }
  }

  function clearLogs() {
    setLogs([]);
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">급여 명세서</h1>
          <p className="page-subtitle">직원은 본인의 확정된 급여 내역만 조회할 수 있습니다.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            직원 포털
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            관리자
          </Link>
          <Link className="btn btn-secondary" href="/">
            홈
          </Link>
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          현재 환경은 <strong>production</strong>입니다. 명세서 조회를 위해 로그인 세션(Bearer)이 필요합니다:{" "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>명세서 건수</p>
          <strong>{payslipStats.count}</strong>
        </article>
        <article className="kpi-card">
          <p>총지급 합계</p>
          <strong>{formatKrw(payslipStats.totalGross)}</strong>
        </article>
        <article className="kpi-card">
          <p>총공제 합계</p>
          <strong>{formatKrw(payslipStats.totalDeductions)}</strong>
        </article>
        <article className="kpi-card">
          <p>실지급 합계</p>
          <strong>{formatKrw(payslipStats.totalNet)}</strong>
        </article>
        <article className="kpi-card">
          <p>API 호출</p>
          <strong>
            {stats.total} (OK {stats.success} / FAIL {stats.fail})
          </strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>조회 조건</h2>
          <div className="input-grid">
            <label>
              Organization ID (선택)
              <input
                value={organizationId}
                placeholder="예: ORG-00001"
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </label>
            <label>
              내 직원 ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              기간 시작
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              기간 종료
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshPayslips()}>
              조회
            </button>
            <button className="btn btn-secondary" onClick={applyCurrentMonthRange}>
              이번 달
            </button>
            <button className="btn btn-secondary" onClick={applyPreviousMonthRange}>
              지난 달
            </button>
            <button className="btn btn-secondary" onClick={applyLastThreeMonthsRange}>
              최근 3개월
            </button>
          </div>

          {showDevTools ? (
            <details className="details" style={{ marginTop: 12 }}>
              <summary>
                개발/검증 설정 <small>(기본은 숨김)</small>
              </summary>
              <div className="input-grid" style={{ marginTop: 12 }}>
                <label className="full">
                  Bearer Access Token (선택)
                  <textarea
                    rows={3}
                    placeholder="비어 있으면 x-actor-* 헤더 모드가 사용됩니다."
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                  />
                </label>
              </div>
              <p className="small">
                호출 {stats.total}건 (OK {stats.success} / FAIL {stats.fail}) · 현재 {pendingLabel ?? "-"}
              </p>
              {isProductionRuntime ? (
                <p className="small muted">
                  세션:{" "}
                  {supabaseSession
                    ? `${supabaseSession.email ?? supabaseSession.userId} · role=${supabaseSession.role ?? "-"} · org=${supabaseSession.organizationId ?? "-"} · actor=${supabaseSession.actorId ?? "-"}`
                    : "없음"}{" "}
                  (Bearer {usesBearerToken ? "ON" : "OFF"})
                </p>
              ) : null}
              {supabaseSessionError ? (
                <p className="small" style={{ color: "var(--danger)" }}>
                  세션 오류: {supabaseSessionError}
                </p>
              ) : null}
              <div className="actions">
                <button className="btn btn-secondary" onClick={clearLogs} disabled={logs.length === 0}>
                  로그 초기화
                </button>
              </div>
            </details>
          ) : null}

          {aggregate ? (
            <p className="small">
              근태 요약: 정규 {minutesToHours(aggregate.totals.regular)} / 연장{" "}
              {minutesToHours(aggregate.totals.overtime)} / 야간 {minutesToHours(aggregate.totals.night)} /
              휴일 {minutesToHours(aggregate.totals.holiday)} (급여반영 {aggregate.counts.payable}건)
            </p>
          ) : (
            <p className="small muted">근태 집계가 없습니다.</p>
          )}
        </article>

        <article className="panel">
          <h2>명세서 목록</h2>
          {runs.length === 0 ? (
            <p className="small muted">확정된 급여가 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="급여 명세서 목록">
              {runs.map((run) => (
                <li
                  key={run.id}
                  style={{
                    borderColor: selectedRun?.id === run.id ? "var(--primary)" : "var(--line)",
                    background: selectedRun?.id === run.id ? "var(--primary-soft)" : "#fff"
                  }}
                >
                  <span>
                    <strong>{formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)}</strong>{" "}
                    <span className="muted">
                      총지급 {formatKrw(run.grossPayKrw)} · 공제 {formatKrw(run.totalDeductionsKrw)} · 실지급{" "}
                      {formatKrw(run.netPayKrw)} · 확정 {formatDateTime(run.confirmedAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    선택
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>선택 명세서 상세</h2>
          {!selectedRun ? (
            <p className="small muted">선택된 명세서가 없습니다.</p>
          ) : (
            <>
              <ul className="simple-list" aria-label="선택 명세서 상세">
                <li>
                  <span className="muted">명세서 ID</span>
                  <strong>{selectedRun.id}</strong>
                </li>
                <li>
                  <span className="muted">기간</span>
                  <strong>
                    {formatDateTime(selectedRun.periodStart)} ~ {formatDateTime(selectedRun.periodEnd)}
                  </strong>
                </li>
                <li>
                  <span className="muted">총지급</span>
                  <strong>{formatKrw(selectedRun.grossPayKrw)}</strong>
                </li>
                <li>
                  <span className="muted">총공제</span>
                  <strong>{formatKrw(selectedRun.totalDeductionsKrw)}</strong>
                </li>
                <li>
                  <span className="muted">실지급</span>
                  <strong>{formatKrw(selectedRun.netPayKrw)}</strong>
                </li>
                <li>
                  <span className="muted">확정 시각</span>
                  <strong>{formatDateTime(selectedRun.confirmedAt)}</strong>
                </li>
              </ul>

              {aggregate ? (
                <p className="small" style={{ marginTop: 12 }}>
                  근태 기준: 정규 {minutesToHours(aggregate.totals.regular)} / 연장{" "}
                  {minutesToHours(aggregate.totals.overtime)} / 야간{" "}
                  {minutesToHours(aggregate.totals.night)} / 휴일 {minutesToHours(aggregate.totals.holiday)}
                </p>
              ) : null}

              <div className="actions">
                <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
                  인쇄
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void copySelectedRunId()}>
                  명세서 ID 복사
                </button>
              </div>
            </>
          )}
        </article>

      </section>
    </main>
  );
}

