"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type {
  ApiLog,
  PayrollRunReceiptDto,
  PayrollRunsResponse,
  ReceiptAcknowledgeResponse
} from "@/components/payslip-receipts/types";
import {
  defaultMonthRange,
  formatDateTime,
  formatKrw,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payslip-receipts/types";

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

export default function PayslipReceiptConsole() {
  const range = defaultMonthRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [runs, setRuns] = useState<PayrollRunReceiptDto[]>([]);
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

  const receiptSummary = useMemo(() => {
    const distributed = runs.filter((run) => run.payslipDistributedAt !== null).length;
    const confirmed = runs.filter((run) => run.payslipReceiptConfirmedAt !== null).length;
    const pending = runs.filter(
      (run) => run.payslipDistributedAt !== null && run.payslipReceiptConfirmedAt === null
    ).length;
    return {
      total: runs.length,
      distributed,
      confirmed,
      pending
    };
  }, [runs]);

  function actorHeaders() {
    const headers: Record<string, string> = {};
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "employee";
      headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function loadRuns() {
    if (!employeeId.trim()) {
      setStatusMessage("employeeId is required");
      return;
    }

    try {
      setPendingLabel("load payslip receipt list");
      const query = buildQuery({
        from: toSeoulStartIso(periodStartDate),
        to: toSeoulEndIso(periodEndDate),
        employeeId: employeeId.trim(),
        state: "CONFIRMED"
      });
      const response = await fetch(`/api/payroll/runs${query}`, {
        method: "GET",
        headers: actorHeaders()
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
          label: "list receipt-eligible payslips",
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

      const parsed = body as PayrollRunsResponse;
      setRuns(parsed.runs ?? []);
      setStatusMessage(`loaded ${parsed.runs?.length ?? 0} confirmed payslips`);
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setPendingLabel(null);
    }
  }

  async function acknowledgeReceipt(runId: string) {
    try {
      setPendingLabel(`confirm receipt ${runId}`);
      const response = await fetch(`/api/payroll/payslips/${runId}/acknowledge`, {
        method: "POST",
        headers: actorHeaders()
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
          label: `acknowledge payslip receipt (${runId})`,
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

      const parsed = body as ReceiptAcknowledgeResponse;
      setStatusMessage(
        parsed.receipt.alreadyConfirmed
          ? `receipt already confirmed for ${runId}`
          : `receipt confirmed for ${runId}`
      );
      await loadRuns();
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Employee</p>
        <h1>Payslip Receipt Confirmation</h1>
        <p>Review distributed payslips and confirm receipt for payroll close compliance.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Filters</h2>
          <div className="input-grid">
            <label>
              Employee ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              Period Start
              <input type="date" value={periodStartDate} onChange={(event) => setPeriodStartDate(event.target.value)} />
            </label>
            <label>
              Period End
              <input type="date" value={periodEndDate} onChange={(event) => setPeriodEndDate(event.target.value)} />
            </label>
          </div>
          <label>
            Access Token (optional)
            <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" />
          </label>
          <label>
            Organization ID (dev fallback)
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void loadRuns()} disabled={pendingLabel !== null}>
              Load Payslips
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Receipt Status</h2>
          <ul className="simple-list">
            <li><span>Total Confirmed Runs</span><strong>{receiptSummary.total}</strong></li>
            <li><span>Distributed</span><strong>{receiptSummary.distributed}</strong></li>
            <li><span>Receipt Confirmed</span><strong>{receiptSummary.confirmed}</strong></li>
            <li><span>Pending Confirmation</span><strong>{receiptSummary.pending}</strong></li>
          </ul>
        </article>

        <article className="panel">
          <h2>Runs</h2>
          {runs.length === 0 ? (
            <p className="small">No confirmed payslips loaded yet.</p>
          ) : (
            <ul className="log-list">
              {runs.map((run) => (
                <li key={run.id}>
                  <strong>{run.id}</strong> ({formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)})
                  <br />
                  Net {formatKrw(run.netPayKrw)} / Delivered {formatDateTime(run.payslipDistributedAt)} / Receipt {formatDateTime(run.payslipReceiptConfirmedAt)}
                  <div className="panel-actions">
                    <button
                      className="btn btn-secondary"
                      onClick={() => void acknowledgeReceipt(run.id)}
                      disabled={pendingLabel !== null || run.payslipDistributedAt === null}
                    >
                      Confirm Receipt
                    </button>
                  </div>
                </li>
              ))}
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
            <Link href="/employee" className="btn btn-secondary">Back to Employee</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
