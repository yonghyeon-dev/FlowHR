"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type { ApiLog, AutoGrantResponse } from "@/components/leave-accrual/types";
import { formatDateTime, formatDays, isTruthyFlag } from "@/components/leave-accrual/types";

export default function LeaveAccrualAutoGrantConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [includeAlreadySettled, setIncludeAlreadySettled] = useState(true);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<AutoGrantResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
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

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  async function callApi(label: string, payload: Record<string, unknown>) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {
        "content-type": "application/json"
      };
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (organizationId.trim()) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch("/api/leave/accrual/auto-grant", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
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

  async function runAutoGrant(dryRun: boolean) {
    if (!organizationId.trim()) {
      return;
    }

    const parsedYear = Number(year);
    if (!Number.isInteger(parsedYear) || parsedYear < 2000 || parsedYear > 9999) {
      setStatusMessage("정산 연도는 2000~9999 사이 정수여야 합니다.");
      return;
    }

    const { response, body } = await callApi(
      dryRun ? "연차 자동 부여 드라이런" : "연차 자동 부여 실행",
      {
        organizationId: organizationId.trim(),
        year: parsedYear,
        dryRun,
        includeAlreadySettled
      }
    );

    if (!response.ok || !body || typeof body !== "object") {
      setStatusMessage("요청이 실패했습니다. 로그를 확인하세요.");
      return;
    }

    const parsed = body as AutoGrantResponse;
    setResult(parsed);
    if (parsed.dryRun) {
      setStatusMessage(
        `드라이런 완료: eligible ${parsed.summary.eligibleCount}, alreadySettled ${parsed.summary.alreadySettledCount}`
      );
    } else {
      setStatusMessage(
        `실행 완료: applied ${parsed.summary.appliedCount}, failed ${parsed.summary.failedCount}`
      );
    }
    setTimeout(() => setStatusMessage(""), 3000);
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>연차 자동 부여 엔진</h1>
        <p>조직의 연차 정책을 기준으로 대상 연도 자동 부여량을 계산하고 드라이런/실행으로 적용합니다.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>실행 조건</h2>
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
              정산 연도
              <input type="number" min={2000} max={9999} value={year} onChange={(event) => setYear(event.target.value)} />
            </label>
            <label>
              결과에 already settled 포함
              <select
                value={includeAlreadySettled ? "yes" : "no"}
                onChange={(event) => setIncludeAlreadySettled(event.target.value === "yes")}
              >
                <option value="yes">yes</option>
                <option value="no">no</option>
              </select>
            </label>
          </div>
          <div className="panel-actions">
            <button
              className="btn btn-secondary"
              onClick={() => void runAutoGrant(true)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              드라이런
            </button>
            <button
              className="btn btn-primary"
              onClick={() => void runAutoGrant(false)}
              disabled={!organizationId.trim() || pendingLabel !== null}
            >
              자동 부여 실행
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session 오류: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>정책/요약</h2>
          {!result ? (
            <p className="small">아직 실행 결과가 없습니다.</p>
          ) : (
            <>
              <ul className="simple-list">
                <li>
                  <span>organizationId</span>
                  <strong>{result.organizationId}</strong>
                </li>
                <li>
                  <span>year / dryRun</span>
                  <strong>
                    {result.year} / {result.dryRun ? "yes" : "no"}
                  </strong>
                </li>
                <li>
                  <span>policy</span>
                  <strong>
                    grant {result.policy.annualGrantDays}, carry cap {result.policy.carryOverCapDays} ({result.policy.source})
                  </strong>
                </li>
                <li>
                  <span>eligible / applied / failed</span>
                  <strong>
                    {result.summary.eligibleCount} / {result.summary.appliedCount} / {result.summary.failedCount}
                  </strong>
                </li>
              </ul>
            </>
          )}
        </article>

        <article className="panel">
          <h2>대상 상세 {result ? `(${result.results.length})` : ""}</h2>
          {!result || result.results.length === 0 ? (
            <p className="small">표시할 대상 결과가 없습니다.</p>
          ) : (
            <ul className="simple-list">
              {result.results.map((row) => (
                <li key={row.employeeId}>
                  <span>
                    <strong>{row.employeeId}</strong>
                    {row.name ? ` / ${row.name}` : ""}
                    <br />
                    <span className="small">
                      status {row.status}
                      {row.reason ? ` / ${row.reason}` : ""}
                      {" / "}join {formatDateTime(row.joinedAt)}
                    </span>
                    <br />
                    <span className="small">
                      suggested {formatDays(row.suggestedAnnualGrantDays)} + carry {formatDays(row.carryOverAppliedDays)} = projected{" "}
                      {formatDays(row.projectedGrantedDays)}
                    </span>
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
            <Link href="/admin" className="btn btn-secondary">
              관리자 홈
            </Link>
            {showDevTools ? (
              <Link href="/ops/leave-promotion" className="btn btn-secondary">
                (dev) 연차촉진 공지
              </Link>
            ) : null}
          </div>
        </article>
      </section>
    </main>
  );
}
