"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type { ApiLog, PayrollClosePeriodResponse } from "@/components/payroll-close/types";
import {
  defaultMonthRange,
  formatKrw,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-close/types";

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

export default function PayrollClosePeriodConsole() {
  const range = defaultMonthRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [priorPaidWithholdingTaxKrw, setPriorPaidWithholdingTaxKrw] = useState("0");
  const [priorPaidSocialInsuranceKrw, setPriorPaidSocialInsuranceKrw] = useState("0");
  const [priorPaidNetPayKrw, setPriorPaidNetPayKrw] = useState("0");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PayrollClosePeriodResponse | null>(null);
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

  async function runClosePeriod(apply: boolean) {
    try {
      const payload = {
        periodStart: toSeoulStartIso(periodStartDate),
        periodEnd: toSeoulEndIso(periodEndDate),
        apply,
        settlement: {
          priorPaidWithholdingTaxKrw: parseRequiredInt(
            priorPaidWithholdingTaxKrw,
            "priorPaidWithholdingTaxKrw"
          ),
          priorPaidSocialInsuranceKrw: parseRequiredInt(
            priorPaidSocialInsuranceKrw,
            "priorPaidSocialInsuranceKrw"
          ),
          priorPaidNetPayKrw: parseRequiredInt(priorPaidNetPayKrw, "priorPaidNetPayKrw")
        }
      };

      setPendingLabel(apply ? "payroll period close apply" : "payroll period close preview");
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

      const response = await fetch("/api/payroll/runs/close-period", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      setLogs((prev) => [
        {
          id: Date.now(),
          label: apply ? "apply close period" : "preview close period",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);

      if (!response.ok || !body || typeof body !== "object") {
        setStatusMessage("request failed; check logs");
        return;
      }

      const parsed = body as PayrollClosePeriodResponse;
      setResult(parsed);
      setStatusMessage(
        parsed.summary.canClose
          ? `loaded close summary; remittance delta ${formatKrw(parsed.summary.settlementKrw.remittanceDeltaKrw)}`
          : "loaded close summary with blocking reasons"
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
        <h1>Payroll Close Period</h1>
        <p>Preview/apply period close workflow with withholding settlement deltas from confirmed payroll runs.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <div className="input-grid">
            <label>
              Period Start
              <input type="date" value={periodStartDate} onChange={(event) => setPeriodStartDate(event.target.value)} />
            </label>
            <label>
              Period End
              <input type="date" value={periodEndDate} onChange={(event) => setPeriodEndDate(event.target.value)} />
            </label>
            <label>
              Prior Paid Withholding (KRW)
              <input value={priorPaidWithholdingTaxKrw} onChange={(event) => setPriorPaidWithholdingTaxKrw(event.target.value)} />
            </label>
            <label>
              Prior Paid Social Insurance (KRW)
              <input value={priorPaidSocialInsuranceKrw} onChange={(event) => setPriorPaidSocialInsuranceKrw(event.target.value)} />
            </label>
            <label>
              Prior Paid Net Payout (KRW)
              <input value={priorPaidNetPayKrw} onChange={(event) => setPriorPaidNetPayKrw(event.target.value)} />
            </label>
          </div>
          <label>
            Access Token (optional)
            <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" />
          </label>
          <label>
            Actor ID (dev fallback)
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            Organization ID (dev fallback)
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runClosePeriod(false)} disabled={pendingLabel !== null}>
              Preview Close
            </button>
            <button className="btn btn-primary" onClick={() => void runClosePeriod(true)} disabled={pendingLabel !== null}>
              Apply Close
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Run States</h2>
          {!result ? (
            <p className="small">No close summary yet.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Can Close</span><strong>{result.summary.canClose ? "YES" : "NO"}</strong></li>
              <li><span>Total / Confirmed / Previewed</span><strong>{result.summary.runStates.totalRuns} / {result.summary.runStates.confirmedRuns} / {result.summary.runStates.previewedRuns}</strong></li>
              <li><span>Blocking Run IDs</span><strong>{result.summary.runStates.blockingRunIds.join(", ") || "-"}</strong></li>
              <li><span>Blocking Reasons</span><strong>{result.summary.runStates.blockingReasons.join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Totals / Delta</h2>
          {!result ? (
            <p className="small">No totals yet.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Gross / Net</span><strong>{formatKrw(result.summary.totalsKrw.grossPayKrw)} / {formatKrw(result.summary.totalsKrw.netPayKrw)}</strong></li>
              <li><span>Withholding / Social Insurance</span><strong>{formatKrw(result.summary.totalsKrw.withholdingTaxKrw)} / {formatKrw(result.summary.totalsKrw.socialInsuranceKrw)}</strong></li>
              <li><span>Deductions / Other</span><strong>{formatKrw(result.summary.totalsKrw.totalDeductionsKrw)} / {formatKrw(result.summary.totalsKrw.otherDeductionsKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(result.summary.settlementKrw.withholdingTaxDeltaKrw)}</strong></li>
              <li><span>Social Insurance Delta</span><strong>{formatKrw(result.summary.settlementKrw.socialInsuranceDeltaKrw)}</strong></li>
              <li><span>Net Pay Delta</span><strong>{formatKrw(result.summary.settlementKrw.netPayDeltaKrw)}</strong></li>
              <li><span>Remittance Delta</span><strong>{formatKrw(result.summary.settlementKrw.remittanceDeltaKrw)}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>API Logs</h2>
          <p className="small">
            total {stats.total} / success {stats.success} / fail {stats.fail}
            {pendingLabel ? ` / running ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">No API call yet.</p>
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
            <Link href="/admin" className="btn btn-secondary">Back to Admin</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
