"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type { ApiLog, PayrollInsuranceSettlementResponse } from "@/components/payroll-insurance/types";
import {
  defaultMonthRange,
  formatKrw,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-insurance/types";

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

function parseOptionalInt(value: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error("optional cap values must be non-negative integers");
  }
  return parsed;
}

export default function PayrollInsuranceSettlementConsole() {
  const range = defaultMonthRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [hourlyRateKrw, setHourlyRateKrw] = useState("12000");
  const [nonTaxableIncomeKrw, setNonTaxableIncomeKrw] = useState("0");
  const [priorWithheldKrw, setPriorWithheldKrw] = useState("0");
  const [priorEmployerPaidKrw, setPriorEmployerPaidKrw] = useState("0");
  const [nationalPensionCapKrw, setNationalPensionCapKrw] = useState("");
  const [healthInsuranceCapKrw, setHealthInsuranceCapKrw] = useState("");
  const [employmentInsuranceCapKrw, setEmploymentInsuranceCapKrw] = useState("");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PayrollInsuranceSettlementResponse | null>(null);
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

  async function runPreview() {
    if (!employeeId.trim()) {
      setStatusMessage("employeeId is required");
      return;
    }

    try {
      const payload = {
        employeeId: employeeId.trim(),
        periodStart: toSeoulStartIso(periodStartDate),
        periodEnd: toSeoulEndIso(periodEndDate),
        hourlyRateKrw: parseRequiredInt(hourlyRateKrw, "hourlyRateKrw"),
        multipliers: {
          regular: 1,
          overtime: 1.5,
          night: 1.5,
          holiday: 2
        },
        settlement: {
          nonTaxableIncomeKrw: parseRequiredInt(nonTaxableIncomeKrw, "nonTaxableIncomeKrw"),
          requireMonthlyBoundary: true,
          nationalPensionCapKrw: parseOptionalInt(nationalPensionCapKrw),
          healthInsuranceCapKrw: parseOptionalInt(healthInsuranceCapKrw),
          employmentInsuranceCapKrw: parseOptionalInt(employmentInsuranceCapKrw),
          priorWithheldKrw: parseRequiredInt(priorWithheldKrw, "priorWithheldKrw"),
          priorEmployerPaidKrw: parseRequiredInt(priorEmployerPaidKrw, "priorEmployerPaidKrw")
        }
      };

      setPendingLabel("payroll insurance settlement preview");
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

      const response = await fetch("/api/payroll/runs/preview-insurance-settlement", {
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
          label: "preview insurance settlement",
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

      const parsed = body as PayrollInsuranceSettlementResponse;
      setResult(parsed);
      setStatusMessage(
        `loaded gross ${formatKrw(parsed.summary.grossPayKrw)}, total delta ${formatKrw(parsed.summary.settlementKrw.totalDeltaKrw)}`
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
        <h1>Payroll Insurance Settlement</h1>
        <p>Preview employee/employer 4-insurance contributions and settlement deltas for a payroll period.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <label>
            Employee ID
            <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
          </label>
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
              Hourly Rate (KRW)
              <input value={hourlyRateKrw} onChange={(event) => setHourlyRateKrw(event.target.value)} />
            </label>
            <label>
              Non-taxable Income (KRW)
              <input value={nonTaxableIncomeKrw} onChange={(event) => setNonTaxableIncomeKrw(event.target.value)} />
            </label>
            <label>
              Prior Withheld (KRW)
              <input value={priorWithheldKrw} onChange={(event) => setPriorWithheldKrw(event.target.value)} />
            </label>
            <label>
              Prior Employer Paid (KRW)
              <input value={priorEmployerPaidKrw} onChange={(event) => setPriorEmployerPaidKrw(event.target.value)} />
            </label>
            <label>
              National Pension Cap (optional)
              <input value={nationalPensionCapKrw} onChange={(event) => setNationalPensionCapKrw(event.target.value)} />
            </label>
            <label>
              Health Insurance Cap (optional)
              <input value={healthInsuranceCapKrw} onChange={(event) => setHealthInsuranceCapKrw(event.target.value)} />
            </label>
            <label>
              Employment Insurance Cap (optional)
              <input value={employmentInsuranceCapKrw} onChange={(event) => setEmploymentInsuranceCapKrw(event.target.value)} />
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
            <button className="btn btn-primary" onClick={() => void runPreview()} disabled={pendingLabel !== null}>
              Preview Settlement
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Summary</h2>
          {!result ? (
            <p className="small">No result yet.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Gross / Taxable</span><strong>{formatKrw(result.summary.grossPayKrw)} / {formatKrw(result.summary.taxableBaseKrw)}</strong></li>
              <li><span>Employee Total</span><strong>{formatKrw(result.summary.employeeContributionKrw.totalKrw)}</strong></li>
              <li><span>Employer Total</span><strong>{formatKrw(result.summary.employerContributionKrw.totalKrw)}</strong></li>
              <li><span>Total Delta</span><strong>{formatKrw(result.summary.settlementKrw.totalDeltaKrw)}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Components</h2>
          {!result ? (
            <p className="small">No contribution breakdown yet.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Employee NP/HI/LTC/EI</span><strong>{formatKrw(result.summary.employeeContributionKrw.nationalPensionKrw)} / {formatKrw(result.summary.employeeContributionKrw.healthInsuranceKrw)} / {formatKrw(result.summary.employeeContributionKrw.longTermCareKrw)} / {formatKrw(result.summary.employeeContributionKrw.employmentInsuranceKrw)}</strong></li>
              <li><span>Employer NP/HI/LTC/EI/IA</span><strong>{formatKrw(result.summary.employerContributionKrw.nationalPensionKrw)} / {formatKrw(result.summary.employerContributionKrw.healthInsuranceKrw)} / {formatKrw(result.summary.employerContributionKrw.longTermCareKrw)} / {formatKrw(result.summary.employerContributionKrw.employmentInsuranceKrw)} / {formatKrw(result.summary.employerContributionKrw.industrialAccidentKrw)}</strong></li>
              <li><span>Bases NP/HI/EI/IA</span><strong>{formatKrw(result.summary.contributionBasesKrw.nationalPensionBaseKrw)} / {formatKrw(result.summary.contributionBasesKrw.healthInsuranceBaseKrw)} / {formatKrw(result.summary.contributionBasesKrw.employmentInsuranceBaseKrw)} / {formatKrw(result.summary.contributionBasesKrw.industrialAccidentBaseKrw)}</strong></li>
              <li><span>Prior Withheld / Paid</span><strong>{formatKrw(result.summary.settlementKrw.priorWithheldKrw)} / {formatKrw(result.summary.settlementKrw.priorEmployerPaidKrw)}</strong></li>
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
