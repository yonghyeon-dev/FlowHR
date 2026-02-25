"use client";

import { useMemo, useState } from "react";

import { employeeScheduleCopyByLocale } from "@/components/scheduling/copy";
import {
  type ScheduleApiLog,
  type WorkScheduleDto,
  buildCurrentMonthDateRange,
  buildQuery,
  extractErrorMessage,
  formatDateTime,
  formatHours,
  parseResponseBody,
  toIsoDateRangeEndExclusive,
  toIsoDateRangeStart
} from "@/components/scheduling/helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

export default function EmployeeScheduleBoard() {
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const copy = employeeScheduleCopyByLocale[locale];
  const monthRange = buildCurrentMonthDateRange();

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [fromDate, setFromDate] = useState(monthRange.fromDate);
  const [toDate, setToDate] = useState(monthRange.toDate);
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);
  const [logs, setLogs] = useState<ScheduleApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const summary = useMemo(() => {
    const totalShifts = schedules.length;
    const holidayShifts = schedules.filter((schedule) => schedule.isHoliday).length;
    const totalMinutes = schedules.reduce((sum, schedule) => {
      const start = new Date(schedule.startAt).getTime();
      const end = new Date(schedule.endAt).getTime();
      if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return sum;
      }
      return sum + Math.max(0, Math.round((end - start) / 60000) - schedule.breakMinutes);
    }, 0);
    return { totalShifts, holidayShifts, totalMinutes };
  }, [schedules]);

  const logStats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  async function loadSchedules() {
    if (!fromDate || !toDate) {
      setStatusMessage(copy.statusNeedsRange);
      return;
    }
    if (!usesBearerToken && !organizationId.trim()) {
      setStatusMessage(copy.statusNeedsOrgDev);
      return;
    }

    setPendingLabel(copy.pendingList);
    try {
      const headers: Record<string, string> = {};
      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken}`;
      } else {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        headers["x-actor-organization-id"] = organizationId.trim();
      }

      const response = await fetch(
        `/api/scheduling/schedules${buildQuery({
          from: toIsoDateRangeStart(fromDate),
          to: toIsoDateRangeEndExclusive(toDate)
        })}`,
        { method: "GET", headers }
      );
      const body = await parseResponseBody(response);
      setLogs((previous) => [
        {
          id: Date.now(),
          label: copy.pendingList,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale),
          body
        },
        ...previous
      ]);

      if (!response.ok) {
        throw new Error(`${copy.loadErrorPrefix}: ${extractErrorMessage(body, isKoLocale)}`);
      }

      const list = Array.isArray((body as { schedules?: WorkScheduleDto[] } | null)?.schedules)
        ? ((body as { schedules?: WorkScheduleDto[] }).schedules ?? [])
        : [];
      setSchedules(list);
      setStatusMessage(copy.statusListLoaded);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.loadErrorPrefix);
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.filtersTitle}</h2>
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.employeeIdLabel}
            <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} />
          </label>
          <div className="input-grid">
            <label>
              {copy.fromDateLabel}
              <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
            </label>
            <label>
              {copy.toDateLabel}
              <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={() => void loadSchedules()}>
              {copy.loadAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>

        <article className="panel">
          <h2>{copy.summaryTitle}</h2>
          <ul className="simple-list">
            <li>
              <span>{copy.summaryTotalShifts}</span>
              <strong>{summary.totalShifts}</strong>
            </li>
            <li>
              <span>{copy.summaryHolidayShifts}</span>
              <strong>{summary.holidayShifts}</strong>
            </li>
            <li>
              <span>{copy.summaryWorkHours}</span>
              <strong>{formatHours(summary.totalMinutes)}h</strong>
            </li>
          </ul>
        </article>

        <article className="panel">
          <h2>{copy.listTitle}</h2>
          {schedules.length === 0 ? (
            <p className="small muted">{copy.listEmpty}</p>
          ) : (
            <ul className="simple-list">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span>
                    <strong>{copy.scheduleIdLabel}: {schedule.id}</strong>
                    <br />
                    <span className="small">
                      {copy.periodLabel}: {formatDateTime(schedule.startAt, runtimeLocale)} ~ {formatDateTime(schedule.endAt, runtimeLocale)}
                    </span>
                    <br />
                    <span className="small">
                      {copy.breakLabel}: {schedule.breakMinutes}m / {copy.holidayLabel}:{" "}
                      {schedule.isHoliday ? copy.holidayYes : copy.holidayNo}
                    </span>
                    <br />
                    <span className="small">
                      {copy.updatedAtLabel}: {formatDateTime(schedule.updatedAt, runtimeLocale)}
                    </span>
                    <br />
                    <span className="small">{schedule.notes?.trim() ? schedule.notes : copy.notesFallback}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>{copy.logsTitle}</h2>
          <p className="small">
            {copy.logTotals} {logStats.total} / {copy.logSuccess} {logStats.success} / {copy.logFail} {logStats.fail}
            {pendingLabel ? ` / ${copy.logRunning} ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? (
            <p className="small muted">{copy.logsEmpty}</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span> {log.label} /{" "}
                  {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </main>
  );
}
