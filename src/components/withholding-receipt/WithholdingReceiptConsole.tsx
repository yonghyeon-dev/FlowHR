"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type { ApiLog, WithholdingReceiptResponse } from "@/components/withholding-receipt/types";
import { currentYear, formatKrw } from "@/components/withholding-receipt/types";

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

export default function WithholdingReceiptConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(currentYear()));
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [receipt, setReceipt] = useState<WithholdingReceiptResponse | null>(null);
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
      headers["x-actor-role"] = "employee";
      headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function previewReceipt() {
    try {
      setPendingLabel("withholding receipt preview");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        issue: false
      };
      const response = await fetch("/api/payroll/year-end/withholding-receipts", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as WithholdingReceiptResponse | { error: string };
      setLogs((prev) => [
        { id: Date.now(), label: "preview withholding receipt", status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setReceipt(body);
      setStatusMessage(`loaded receipt ${body.receipt.receiptNumber}`);
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
        <p className="eyebrow">FlowHR Employee</p>
        <h1>Withholding Receipt</h1>
        <p>Preview your yearly withholding receipt readiness and settlement totals.</p>
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <div className="input-grid">
            <label>Year<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>Employee ID<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
          </div>
          <label>Access Token (optional)<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>Organization ID (dev fallback)<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void previewReceipt()} disabled={pendingLabel !== null}>Preview Receipt</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>Receipt Summary</h2>
          {!receipt ? <p className="small">No receipt summary yet.</p> : (
            <ul className="simple-list">
              <li><span>Receipt Number</span><strong>{receipt.receipt.receiptNumber}</strong></li>
              <li><span>Can Issue / Issued</span><strong>{receipt.receipt.canIssue ? "YES" : "NO"} / {receipt.receipt.issued ? "YES" : "NO"}</strong></li>
              <li><span>Gross / Net</span><strong>{formatKrw(receipt.receipt.annualTotalsKrw.grossPayKrw)} / {formatKrw(receipt.receipt.annualTotalsKrw.netPayKrw)}</strong></li>
              <li><span>Withholding / Social</span><strong>{formatKrw(receipt.receipt.annualTotalsKrw.withholdingTaxKrw)} / {formatKrw(receipt.receipt.annualTotalsKrw.socialInsuranceKrw)}</strong></li>
              <li><span>Pending Receipt Runs</span><strong>{receipt.receipt.runStates.pendingReceiptRunIds.join(", ") || "-"}</strong></li>
              <li><span>Blocking Reasons</span><strong>{receipt.receipt.blockingReasons.join(" | ") || "-"}</strong></li>
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
            <Link href="/employee" className="btn btn-secondary">Back to Employee</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
