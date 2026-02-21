"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type { ApiLog, PayrollPayslipDistributionResponse } from "@/components/payroll-payslip-delivery/types";
import {
  defaultMonthRange,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-payslip-delivery/types";

export default function PayrollPayslipDeliveryConsole() {
  const range = defaultMonthRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [deliveryChannel, setDeliveryChannel] = useState<"in_app" | "email">("in_app");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PayrollPayslipDistributionResponse | null>(null);
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

  async function runDistribution(dryRun: boolean) {
    try {
      const payload = {
        periodStart: toSeoulStartIso(periodStartDate),
        periodEnd: toSeoulEndIso(periodEndDate),
        employeeId: employeeId.trim() || undefined,
        deliveryChannel,
        dryRun
      };

      setPendingLabel(dryRun ? "payslip distribution dry-run" : "payslip distribution apply");
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

      const response = await fetch("/api/payroll/payslips/distribute", {
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
          label: dryRun ? "dry-run distribute payslips" : "apply distribute payslips",
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

      const parsed = body as PayrollPayslipDistributionResponse;
      setResult(parsed);
      setStatusMessage(
        dryRun
          ? `dry-run target ${parsed.summary.distribution.targetCount} runs`
          : `distributed ${parsed.summary.distribution.newlyDistributedCount} runs`
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
        <h1>Payroll Payslip Delivery</h1>
        <p>Distribute confirmed payroll payslips and track delivery baseline before employee receipt confirmation.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Distribution Input</h2>
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
              Employee ID (optional)
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} placeholder="EMP-1001" />
            </label>
            <label>
              Delivery Channel
              <select value={deliveryChannel} onChange={(event) => setDeliveryChannel(event.target.value as "in_app" | "email")}>
                <option value="in_app">in_app</option>
                <option value="email">email</option>
              </select>
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
            <button className="btn btn-secondary" onClick={() => void runDistribution(true)} disabled={pendingLabel !== null}>
              Dry-run
            </button>
            <button className="btn btn-primary" onClick={() => void runDistribution(false)} disabled={pendingLabel !== null}>
              Apply Delivery
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Run States</h2>
          {!result ? (
            <p className="small">No distribution summary yet.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Total / Confirmed / Previewed</span><strong>{result.summary.runStates.totalRuns} / {result.summary.runStates.confirmedRuns} / {result.summary.runStates.previewedRuns}</strong></li>
              <li><span>Target Count</span><strong>{result.summary.distribution.targetCount}</strong></li>
              <li><span>Already Distributed</span><strong>{result.summary.distribution.alreadyDistributedCount}</strong></li>
              <li><span>Newly Distributed</span><strong>{result.summary.distribution.newlyDistributedCount}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Run IDs</h2>
          {!result ? (
            <p className="small">No run IDs yet.</p>
          ) : (
            <ul className="simple-list">
              <li><span>Target Runs</span><strong>{result.summary.distribution.targetRunIds.join(", ") || "-"}</strong></li>
              <li><span>Already Distributed Runs</span><strong>{result.summary.distribution.alreadyDistributedRunIds.join(", ") || "-"}</strong></li>
              <li><span>Newly Distributed Runs</span><strong>{result.summary.distribution.newlyDistributedRunIds.join(", ") || "-"}</strong></li>
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
