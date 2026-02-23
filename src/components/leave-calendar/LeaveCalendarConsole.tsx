"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import { leaveCalendarCopyByLocale } from "@/components/leave-calendar/copy";
import type { ApiLog, LeaveCalendarResponse } from "@/components/leave-calendar/types";
import { addDays, defaultCalendarRange, toDateInputValue, toSeoulIsoStart } from "@/components/leave-calendar/types";
export default function LeaveCalendarConsole() {
  const { locale } = useI18n();
  const copy = leaveCalendarCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const formatDateByLocale = (value: string) => new Date(value).toLocaleDateString(runtimeLocale);
  const formatDateTimeByLocale = (value: string) => new Date(value).toLocaleString(runtimeLocale);
  const stateLabelByCode = { APPROVED: copy.approvedStateLabel, PENDING: copy.pendingStateLabel } as const;
  const leaveTypeLabelByCode = {
    ANNUAL: copy.annualLeaveTypeLabel,
    SICK: copy.sickLeaveTypeLabel,
    UNPAID: copy.unpaidLeaveTypeLabel
  } as const;
  const unitLabelByCode = {
    FULL_DAY: copy.fullDayUnitLabel,
    HALF_DAY: copy.halfDayUnitLabel,
    HOUR: copy.hourUnitLabel
  } as const;

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
      setStatusMessage(copy.fromToRequiredStatus);
      return;
    }
    const threshold = Number(overlapWarningThreshold);
    if (!Number.isInteger(threshold) || threshold < 1 || threshold > 100) {
      setStatusMessage(copy.overlapThresholdInvalidStatus);
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
    setPendingLabel(copy.pendingLeaveCalendarQuery);
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
          label: copy.logLeaveCalendarQuery,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || !body || typeof body !== "object") {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      const parsed = body as LeaveCalendarResponse;
      setResult(parsed);
      setStatusMessage(
        `${copy.loadedSummaryPrefix} ${parsed.summary.dayCount} ${copy.daysLabel}, ${copy.warningsLabel} ${parsed.summary.warningDayCount}, ${copy.entriesLabel} ${parsed.entries.length}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } finally {
      setPendingLabel(null);
    }
  }
  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.queryTitle}</h2>
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.departmentIdOptionalLabel}
            <input value={departmentId} onChange={(event) => setDepartmentId(event.target.value)} />
          </label>
          <div className="input-grid">
            <label>
              {copy.fromLabel}
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              {copy.toLabel}
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>
          <div className="input-grid">
            <label>
              {copy.includePendingLabel}
              <select value={includePending ? "yes" : "no"} onChange={(event) => setIncludePending(event.target.value === "yes")}>
                <option value="no">{copy.includePendingNoOption}</option>
                <option value="yes">{copy.includePendingYesOption}</option>
              </select>
            </label>
            <label>
              {copy.overlapWarningThresholdLabel}
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
            {copy.adminActorIdFallbackLabel}
            <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder={copy.bearerTokenPlaceholder} />
          </label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void callApi()} disabled={!organizationId.trim() || pendingLabel !== null}>
              {copy.loadCalendarAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>{copy.summaryTitle}</h2>
          {!result ? (
            <p className="small">{copy.noQueryResultYet}</p>
          ) : (
            <ul className="simple-list">
              <li>
                <span>{copy.organizationLabel}</span>
                <strong>{result.organizationId}</strong>
              </li>
              <li>
                <span>{copy.rangeLabel}</span>
                <strong>
                  {formatDateByLocale(result.period.from)} - {formatDateByLocale(result.period.to)}
                </strong>
              </li>
              <li>
                <span>{copy.employeesEntriesLabel}</span>
                <strong>
                  {result.summary.uniqueEmployeeCount} / {result.entries.length}
                </strong>
              </li>
              <li>
                <span>{copy.warningsLabel}</span>
                <strong>{result.summary.warningDayCount}</strong>
              </li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>{copy.warningDaysTitle}</h2>
          {!result || result.summary.warningDayCount === 0 ? (
            <p className="small">{copy.noOverlapWarningDay}</p>
          ) : (
            <ul className="simple-list">
              {result.days
                .filter((day) => day.warning)
                .map((day) => (
                  <li key={day.date}>
                    <span>
                    <strong>{day.date}</strong>
                      <br />
                      <span className="small">{copy.approvedPendingLabel} {day.approvedCount} / {day.pendingCount}</span>
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>{copy.entriesTitle} {result ? `(${result.entries.length})` : ""}</h2>
          {!result || result.entries.length === 0 ? (
            <p className="small">{copy.noLeaveEntryInRange}</p>
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
                      {stateLabelByCode[entry.state]} / {leaveTypeLabelByCode[entry.leaveType]} / {unitLabelByCode[entry.unit]} / {entry.days}{copy.daysLabel}
                      {entry.hours !== null ? ` (${entry.hours}h)` : ""}
                    </span>
                    <br />
                    <span className="small">
                      {formatDateTimeByLocale(entry.startDate)} - {formatDateTimeByLocale(entry.endDate)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
          {result && result.entries.length > 80 ? <p className="small">{copy.showingFirstEntriesSuffix}</p> : null}
        </article>
        <article className="panel">
          <h2>{copy.apiLogsTitle}</h2>
          <p className="small">
            {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel} {stats.fail}
            {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small">{copy.noApiCallYet}</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span> {log.label} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/admin" className="btn btn-secondary">
              {copy.backToAdminAction}
            </Link>
            <Link href="/admin/leave-accrual" className="btn btn-secondary">
              {copy.leaveAccrualAction}
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}
