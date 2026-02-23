"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type {
  ApiLog,
  PayrollYearEndPreflightChecklistResponse
} from "@/components/payroll-year-end/types";
import { currentYear, formatKrw } from "@/components/payroll-year-end/types";

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

export default function PayrollYearEndPreflightConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [year, setYear] = useState(String(currentYear()));
  const [nonTaxableAnnualIncomeKrw, setNonTaxableAnnualIncomeKrw] = useState("0");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [checklist, setChecklist] = useState<PayrollYearEndPreflightChecklistResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

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

  function buildHeaders() {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "payroll_operator";
      headers["x-actor-id"] = adminActorId.trim() || "PAY-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function runLoadChecklist() {
    try {
      setPendingLabel("year-end preflight checklist");
      const requestYear = parseRequiredInt(year, "year");
      const requestEmployeeId = employeeId.trim();
      const requestNonTaxableAnnualIncomeKrw = parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
        "nonTaxableAnnualIncomeKrw"
      );
      const query = new URLSearchParams({
        year: String(requestYear),
        employeeId: requestEmployeeId,
        nonTaxableAnnualIncomeKrw: String(requestNonTaxableAnnualIncomeKrw)
      });
      const response = await fetch(
        `/api/payroll/year-end/preflight-checklist?${query.toString()}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as PayrollYearEndPreflightChecklistResponse | { error: string };
      setLogs((prev) => [
        { id: Date.now(), label: "year-end preflight checklist", status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setChecklist(body);
      setStatusMessage(
        `loaded checklist (${body.checklist.summary.readyToFinalize ? "ready" : "not ready"})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>Payroll Year-End Preflight Checklist</h1>
        <p>Validate finalize prerequisites and filing readiness before year-end settlement apply.</p>
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <div className="input-grid">
            <label>Year<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>Employee ID<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>Non-taxable Annual Income<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
          </div>
          <label>Access Token (optional)<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>Actor ID (dev fallback)<input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} /></label>
          <label>Organization ID (dev fallback)<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void runLoadChecklist()} disabled={pendingLabel !== null}>Load Preflight Checklist</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Checklist Summary</h2>
          {!checklist ? <p className="small">No checklist loaded yet.</p> : (
            <ul className="simple-list">
              <li><span>Ready To Finalize</span><strong>{checklist.checklist.summary.readyToFinalize ? "YES" : "NO"}</strong></li>
              <li><span>Pass / Fail / Warn</span><strong>{checklist.checklist.summary.passCount} / {checklist.checklist.summary.failCount} / {checklist.checklist.summary.warnCount}</strong></li>
              <li><span>Annual Gross Pay</span><strong>{formatKrw(checklist.checklist.metrics.annualGrossPayKrw)}</strong></li>
              <li><span>Non-taxable Annual Income</span><strong>{formatKrw(checklist.checklist.metrics.nonTaxableAnnualIncomeKrw)}</strong></li>
              <li><span>Run States</span><strong>total {checklist.checklist.metrics.totalRuns} / confirmed {checklist.checklist.metrics.confirmedRuns} / previewed {checklist.checklist.metrics.previewedRuns}</strong></li>
              <li><span>Distribution States</span><strong>undistributed {checklist.checklist.metrics.undistributedRuns} / pending receipt {checklist.checklist.metrics.pendingReceiptRuns}</strong></li>
              <li><span>Submission States</span><strong>pending {checklist.checklist.metrics.pendingSubmissionCount} / rejected {checklist.checklist.metrics.rejectedSubmissionCount}</strong></li>
              <li><span>Settlement Hash</span><strong>{checklist.checklist.metrics.settlementHash ?? "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Checks</h2>
          {!checklist ? <p className="small">No check entries yet.</p> : (
            <ul className="log-list">
              {checklist.checklist.checks.map((check) => (
                <li key={check.key}>
                  <span
                    className={
                      check.status === "pass"
                        ? "ok"
                        : check.status === "fail"
                          ? "fail"
                          : "small"
                    }
                  >
                    {check.status.toUpperCase()}
                  </span>{" "}
                  {check.label} / {check.detail}
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>API Logs</h2>
          <p className="small">total {stats.total} / success {stats.success} / fail {stats.fail}{pendingLabel ? ` / running ${pendingLabel}` : ""}</p>
          {logs.length === 0 ? <p className="small">No API call yet.</p> : (
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
            <Link href="/admin/payroll-year-end" className="btn btn-secondary">Back to Year-End</Link>
            <Link href="/admin" className="btn btn-secondary">Back to Admin</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
