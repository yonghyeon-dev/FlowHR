"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { EmployeeWorkspaceHero } from "@/components/employee-dashboard/EmployeeWorkspaceHero";
import type { EmployeeScheduleCopy } from "@/components/scheduling/copy";
import { resolveEmployeeScheduleSourceEntry } from "@/components/scheduling/employee-source-context";
import {
  formatEmployeeSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";
import {
  formatDateTime,
  formatHours,
  type ScheduleApiLog,
  type ScheduleHolidayFilter,
  type ScheduleStatusFilter,
  type ScheduleTimeStatus,
  type WorkScheduleDto
} from "@/components/scheduling/helpers";
type EmployeeScheduleBoardViewProps = {
  copy: EmployeeScheduleCopy;
  runtimeLocale: string;
  showDevTools: boolean;
  requiresLoginSession: boolean;
  productionSessionRequiredNotice: string;
  statusMessage: string;
  pendingLabel: string | null;
  logStats: { total: number; success: number; fail: number };
  rows: Array<{ schedule: WorkScheduleDto; status: ScheduleTimeStatus }>;
  allScheduleCount: number;
  nextSchedule: WorkScheduleDto | null;
  summary: {
    totalShifts: number;
    holidayShifts: number;
    totalMinutes: number;
    averageMinutesPerShift: number;
    upcomingShifts: number;
    inProgressShifts: number;
    completedShifts: number;
  };
  logs: ScheduleApiLog[];
  sessionOrganizationId: string;
  sessionEmployeeId: string;
  fromDate: string;
  toDate: string;
  statusFilter: ScheduleStatusFilter;
  holidayFilter: ScheduleHolidayFilter;
  searchQuery: string;
  visibleScheduleCount: number;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onStatusFilterChange: (value: ScheduleStatusFilter) => void;
  onHolidayFilterChange: (value: ScheduleHolidayFilter) => void;
  onSearchQueryChange: (value: string) => void;
  onLoadSchedules: () => void;
  onApplyCurrentMonthRange: () => void;
  onApplyCurrentWeekRange: () => void;
  onApplyNextWeekRange: () => void;
  onClearSearch: () => void;
  onExportCsv: () => void;
  onExportIcs: () => void;
};
function resolveStatusText(copy: EmployeeScheduleCopy, status: ScheduleTimeStatus) {
  return status === "upcoming"
    ? copy.statusUpcoming
    : status === "in_progress"
      ? copy.statusInProgress
      : copy.statusCompleted;
}
function resolveStatusTone(status: ScheduleTimeStatus) {
  return status === "in_progress" ? "ok" : status === "completed" ? "fail" : "idle";
}
export default function EmployeeScheduleBoardView({
  copy,
  runtimeLocale,
  showDevTools,
  requiresLoginSession,
  productionSessionRequiredNotice,
  statusMessage,
  pendingLabel,
  logStats,
  rows,
  allScheduleCount,
  nextSchedule,
  summary,
  logs,
  sessionOrganizationId,
  sessionEmployeeId,
  fromDate,
  toDate,
  statusFilter,
  holidayFilter,
  searchQuery,
  visibleScheduleCount,
  onFromDateChange,
  onToDateChange,
  onStatusFilterChange,
  onHolidayFilterChange,
  onSearchQueryChange,
  onLoadSchedules,
  onApplyCurrentMonthRange,
  onApplyCurrentWeekRange,
  onApplyNextWeekRange,
  onClearSearch,
  onExportCsv,
  onExportIcs
}: EmployeeScheduleBoardViewProps) {
  const searchParams = useSearchParams();
  const sourceEntry = resolveEmployeeScheduleSourceEntry(searchParams.get("source"), runtimeLocale === "ko-KR");
  const attendanceCorrectionHref = `/employee/attendance?source=employee-schedule&attendanceSource=schedule&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
  const hasWorkspaceSession = sessionOrganizationId.trim().length > 0;
  const hasEmployeeSession = sessionEmployeeId.trim().length > 0;
  return (
    <main className="saas-content">
      <EmployeeWorkspaceHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        sourceHint={sourceEntry?.hint ?? null}
        returnHref={sourceEntry?.returnHref ?? "/employee"}
        returnLabel={sourceEntry?.returnLabel ?? "/employee"}
        metaLabel={copy.statusQuickCorrectionAction}
        actions={[
          {
            href: attendanceCorrectionHref,
            label: copy.statusQuickCorrectionAction,
            tone: "secondary"
          }
        ]}
      />
      {requiresLoginSession ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          {productionSessionRequiredNotice} <Link href="/login">/login</Link>
        </p>
      ) : null}
      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.filtersTitle}</h2>
          {showDevTools ? (
            <p className="small muted">
              {copy.organizationIdLabel}:{" "}
              <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, runtimeLocale)}</strong> /{" "}
              {copy.employeeIdLabel}:{" "}
              <strong>{formatEmployeeSessionConnectionState(hasEmployeeSession, runtimeLocale)}</strong>
            </p>
          ) : null}
          <div className="input-grid">
            <label>
              {copy.fromDateLabel}
              <input type="date" value={fromDate} onChange={(event) => onFromDateChange(event.target.value)} />
            </label>
            <label>
              {copy.toDateLabel}
              <input type="date" value={toDate} onChange={(event) => onToDateChange(event.target.value)} />
            </label>
          </div>
          <div className="input-grid">
            <label>
              {copy.statusFilterLabel}
              <select value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value as ScheduleStatusFilter)}>
                <option value="all">{copy.statusFilterAll}</option>
                <option value="upcoming">{copy.statusFilterUpcoming}</option>
                <option value="in_progress">{copy.statusFilterInProgress}</option>
                <option value="completed">{copy.statusFilterCompleted}</option>
              </select>
            </label>
            <label>
              {copy.holidayFilterLabel}
              <select value={holidayFilter} onChange={(event) => onHolidayFilterChange(event.target.value as ScheduleHolidayFilter)}>
                <option value="all">{copy.holidayFilterAll}</option>
                <option value="holiday">{copy.holidayFilterHoliday}</option>
                <option value="workday">{copy.holidayFilterWorkday}</option>
              </select>
            </label>
          </div>
          <label>
            {copy.searchLabel}
            <input value={searchQuery} placeholder={copy.searchPlaceholder} onChange={(event) => onSearchQueryChange(event.target.value)} />
          </label>
          <div className="actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={onLoadSchedules}
              disabled={requiresLoginSession}
            >
              {copy.loadAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onApplyCurrentMonthRange}>
              {copy.currentMonthAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onApplyCurrentWeekRange}>
              {copy.currentWeekAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onApplyNextWeekRange}>
              {copy.nextWeekAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onClearSearch}>
              {copy.clearSearchAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onExportCsv} disabled={requiresLoginSession}>
              {copy.exportCsvAction}
            </button>
            <button className="btn btn-secondary" type="button" onClick={onExportIcs} disabled={requiresLoginSession}>
              {copy.exportIcsAction}
            </button>
            <a className="btn btn-secondary" href={attendanceCorrectionHref}>{copy.statusQuickCorrectionAction}</a>
          </div>
          <p className="small muted">{copy.visibleCountLabel}: {visibleScheduleCount} / {allScheduleCount}</p>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {statusMessage.includes(copy.statusConflictCandidatesLabel) && !statusMessage.includes(`${copy.statusConflictCandidatesLabel}: 0`) ? <a className="btn btn-secondary btn-small" href={attendanceCorrectionHref}>{copy.statusQuickCorrectionAction}</a> : null}
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
            <li>
              <span>{copy.summaryAverageShiftHours}</span>
              <strong>{formatHours(summary.averageMinutesPerShift)}h</strong>
            </li>
            <li>
              <span>{copy.summaryUpcomingShifts}</span>
              <strong>{summary.upcomingShifts}</strong>
            </li>
            <li>
              <span>{copy.summaryInProgressShifts}</span>
              <strong>{summary.inProgressShifts}</strong>
            </li>
            <li>
              <span>{copy.summaryCompletedShifts}</span>
              <strong>{summary.completedShifts}</strong>
            </li>
          </ul>
        </article>
        <article className="panel">
          <h2>{copy.nextShiftTitle}</h2>
          {!nextSchedule ? (
            <p className="small muted">{copy.nextShiftEmpty}</p>
          ) : (
            <ul className="simple-list">
              <li>
                  <span>
                    <strong>{copy.scheduleIdLabel}: {nextSchedule.id}</strong>
                    <br />
                    <span className="small">{copy.periodLabel}: {formatDateTime(nextSchedule.startAt, runtimeLocale)} ~ {formatDateTime(nextSchedule.endAt, runtimeLocale)}</span>
                    <br />
                    <span className="small">{copy.breakLabel}: {nextSchedule.breakMinutes}m / {copy.holidayLabel}: {nextSchedule.isHoliday ? copy.holidayYes : copy.holidayNo}</span>
                  </span>
                </li>
              </ul>
            )}
          </article>
        <article className="panel">
          <h2>{copy.listTitle}</h2>
          {allScheduleCount === 0 ? (
            <p className="small muted">{copy.listEmpty}</p>
          ) : rows.length === 0 ? (
            <p className="small muted">{copy.listFilteredEmpty}</p>
          ) : (
            <ul className="simple-list">
              {rows.map((row) => (
                <li key={row.schedule.id}>
                  <span>
                    <strong>{copy.scheduleIdLabel}: {row.schedule.id}</strong>{" "}
                    <span className={`status-pill tone-${resolveStatusTone(row.status)}`}>
                      {resolveStatusText(copy, row.status)}
                    </span>
                    <br />
                    <span className="small">{copy.periodLabel}: {formatDateTime(row.schedule.startAt, runtimeLocale)} ~ {formatDateTime(row.schedule.endAt, runtimeLocale)}</span>
                    <br />
                    <span className="small">{copy.breakLabel}: {row.schedule.breakMinutes}m / {copy.holidayLabel}: {row.schedule.isHoliday ? copy.holidayYes : copy.holidayNo}</span>
                    <br />
                    <span className="small">{copy.updatedAtLabel}: {formatDateTime(row.schedule.updatedAt, runtimeLocale)}</span>
                    <br />
                    <span className="small">{row.schedule.notes?.trim() ? row.schedule.notes : copy.notesFallback}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
        {showDevTools ? (
          <article className="panel">
            <h2>{copy.logsTitle}</h2>
            <p className="small">
              {copy.logTotals} {logStats.total} / {copy.logSuccess} {logStats.success} / {copy.logFail}{" "}
              {logStats.fail}
              {pendingLabel ? ` / ${copy.logRunning} ${pendingLabel}` : ""}
            </p>
            {logs.length === 0 ? (
              <p className="small muted">{copy.logsEmpty}</p>
            ) : (
              <ul className="log-list">
                {logs.map((log) => (
                  <li key={log.id}>
                    <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span>{" "}
                    {log.label} / {log.status}
                    <time>{log.at}</time>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : null}
      </section>
    </main>
  );
}
