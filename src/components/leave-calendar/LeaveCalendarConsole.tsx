"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type { ApiLog, LeaveCalendarResponse } from "@/components/leave-calendar/types";
import {
  addDays,
  defaultCalendarRange,
  formatDate,
  formatDateTime,
  toDateInputValue,
  toSeoulIsoStart
} from "@/components/leave-calendar/types";
export default function LeaveCalendarConsole() {
  const defaultRange = defaultCalendarRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [includePending, setIncludePending] = useState(false);
  const [overlapWarningThreshold, setOverlapWarningThreshold] = useState("2");
  const [fromDate, setFromDate] = useState(toDateInputValue(defaultRange.from));
  const [toDate, setToDate] = useState(toDateInputValue(addDays(defaultRange.to.slice(0, 10), -1)));
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<LeaveCalendarResponse | null>(null);
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
  async function callApi() {
    if (!organizationId.trim()) {
      return;
    }
    if (!fromDate || !toDate) {
      setStatusMessage("from/to date is required");
      return;
    }
    const threshold = Number(overlapWarningThreshold);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
      setStatusMessage("overlap threshold must be an integer between 1 and 100");
      return;
    }
    const from = toSeoulIsoStart(fromDate);
    const to = toSeoulIsoStart(addDays(toDate, 1));
    const query = new URLSearchParams({
      from,
      to,
      organizationId: organizationId.trim(),
      includePending: includePending ? "true" : "false",
      overlapWarningThreshold: String(threshold)
    });
    if (departmentId.trim()) {
      query.set("departmentId", departmentId.trim());
    }
    setPendingLabel("leave calendar query");
    try {
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        headers["x-actor-organization-id"] = organizationId.trim();
      }
      const response = await fetch(`/api/leave/calendar?${query.toString()}`, {
        method: "GET",
        headers
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
          label: "leave calendar query",
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
      const parsed = body as LeaveCalendarResponse;
      setResult(parsed);
      setStatusMessage(
        `loaded ${parsed.summary.dayCount} days, warnings ${parsed.summary.warningDayCount}, entries ${parsed.entries.length}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setPendingLabel(null);
    }
  }
  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>Leave Calendar</h1>
        <p>Review department leave occupancy and overlap warnings without growing monolith dashboard pages.</p>
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>Query</h2>
          <label>
            Organization ID
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            Department ID (optional)
            <input value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} />
          </label>
          <div className="input-grid">
            <label>
              From
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              To
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>
          <div className="input-grid">
            <label>
              Include Pending
              <select value={includePending ? "yes" : "no"} onChange={(event) => setIncludePending(event.target.value === "yes")}>
                <option value="no">no</option>
                <option value="yes">yes</option>
              </select>
            </label>
            <label>
              Overlap Warning Threshold
              <input
                type="number"
                min={1}
                max={100}
                value={overlapWarningThreshold}
                onChange={(event) => setOverlapWarningThreshold(event.target.value)}
              />
            </label>
          </div>
          <label>
            Admin Actor ID (dev fallback)
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            Access Token (optional)
            <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" />
          </label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void callApi()} disabled={!organizationId.trim() || pendingLabel !== null}>
              Load Calendar
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>Summary</h2>
          {!result ? (
            <p className="small">No query result yet.</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>Organization</span>
                <strong>{result.organizationId}</strong>
              </li>
              <li>
                <span>Range</span>
                <strong>
                  {formatDate(result.period.from)} - {formatDate(result.period.to)}
                </strong>
              </li>
              <li>
                <span>Employees / Entries</span>
                <strong>
                  {result.summary.uniqueEmployeeCount} / {result.entries.length}
                </strong>
              </li>
              <li>
                <span>Warnings</span>
                <strong>{result.summary.warningDayCount}</strong>
              </li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>Warning Days</h2>
          {!result || result.summary.warningDayCount === 0 ? (
            <p className="small">No overlap warning day.</p>
          ) : (
            <ul className="simple-list">
              {result.days
                .filter((day) => day.warning)
                .map((day) => (
                  <li key={day.date}>
                    <span>
                      <strong>{day.date}</strong>
                      <br />
                      <span className="small">approved {day.approvedCount} / pending {day.pendingCount}</span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>Entries {result ? `(${result.entries.length})` : ""}</h2>
          {!result || result.entries.length === 0 ? (
            <p className="small">No leave entry in range.</p>
          ) : (
            <ul className="simple-list">
              {result.entries.slice(0, 80).map((entry) => (
                <li key={entry.requestId}>
                  <span>
                    <strong>{entry.employeeId}</strong>
                    {entry.employeeName ? ` / ${entry.employeeName}` : ""}
                    {entry.departmentName ? ` / ${entry.departmentName}` : ""}
                    <br />
                    <span className="small">
                      {entry.state} / {entry.leaveType} / {entry.unit} / {entry.days}d
                      {entry.hours !== null ? ` (${entry.hours}h)` : ""}
                    </span>
                    <br />
                    <span className="small">
                      {formatDateTime(entry.startDate)} - {formatDateTime(entry.endDate)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result && result.entries.length > 80 ? <p className="small">Showing first 80 entries.</p> : null}
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
            <Link href="/admin" className="btn btn-secondary">
              Back to Admin
            </Link>
            <Link href="/admin/leave-accrual" className="btn btn-secondary">
              Leave Accrual
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
