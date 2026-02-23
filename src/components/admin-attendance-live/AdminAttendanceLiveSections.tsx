import type {
  AttendanceLiveRow,
  AttendanceLiveStatus,
  AttendanceLiveSummary
} from "@/features/admin-attendance-live/summary";

import type { AttendanceLiveCopy } from "@/components/admin-attendance-live/copy";
import { formatDateTime, formatMinutes } from "@/components/admin-attendance-live/helpers";

export type AttendanceLiveFilterStatus = "all" | AttendanceLiveStatus;

export type AttendanceLiveDepartmentOption = {
  id: string;
  name: string;
};

export type AttendanceLiveApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
  durationMs: number;
};

type ContextPanelProps = {
  copy: AttendanceLiveCopy;
  organizationId: string;
  adminActorId: string;
  accessToken: string;
  periodStart: string;
  periodEnd: string;
  lateThresholdMinutes: string;
  criticalThresholdMinutes: string;
  departmentFilter: string;
  statusFilter: AttendanceLiveFilterStatus;
  searchQuery: string;
  departments: AttendanceLiveDepartmentOption[];
  pendingLabel: string | null;
  refreshDisabled: boolean;
  onSetOrganizationId: (value: string) => void;
  onSetAdminActorId: (value: string) => void;
  onSetAccessToken: (value: string) => void;
  onSetPeriodStart: (value: string) => void;
  onSetPeriodEnd: (value: string) => void;
  onSetLateThresholdMinutes: (value: string) => void;
  onSetCriticalThresholdMinutes: (value: string) => void;
  onSetDepartmentFilter: (value: string) => void;
  onSetStatusFilter: (value: AttendanceLiveFilterStatus) => void;
  onSetSearchQuery: (value: string) => void;
  onSetToday: () => void;
  onRefresh: () => void;
};

export function AdminAttendanceLiveContextPanel(props: ContextPanelProps) {
  const {
    copy,
    organizationId,
    adminActorId,
    accessToken,
    periodStart,
    periodEnd,
    lateThresholdMinutes,
    criticalThresholdMinutes,
    departmentFilter,
    statusFilter,
    searchQuery,
    departments,
    pendingLabel,
    refreshDisabled,
    onSetOrganizationId,
    onSetAdminActorId,
    onSetAccessToken,
    onSetPeriodStart,
    onSetPeriodEnd,
    onSetLateThresholdMinutes,
    onSetCriticalThresholdMinutes,
    onSetDepartmentFilter,
    onSetStatusFilter,
    onSetSearchQuery,
    onSetToday,
    onRefresh
  } = props;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.contextTitle}</h2>
        <div className="input-grid">
          <label>
            {copy.organizationIdLabel}
            <input value={organizationId} onChange={(event) => onSetOrganizationId(event.target.value)} />
          </label>
          <label>
            {copy.adminActorIdLabel}
            <input value={adminActorId} onChange={(event) => onSetAdminActorId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <input value={accessToken} onChange={(event) => onSetAccessToken(event.target.value)} />
          </label>
          <label>
            {copy.periodStartLabel}
            <input type="datetime-local" value={periodStart} onChange={(event) => onSetPeriodStart(event.target.value)} />
          </label>
          <label>
            {copy.periodEndLabel}
            <input type="datetime-local" value={periodEnd} onChange={(event) => onSetPeriodEnd(event.target.value)} />
          </label>
          <label>
            {copy.departmentLabel}
            <select value={departmentFilter} onChange={(event) => onSetDepartmentFilter(event.target.value)}>
              <option value="">{copy.departmentAll}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            {copy.statusLabel}
            <select
              value={statusFilter}
              onChange={(event) => onSetStatusFilter(event.target.value as AttendanceLiveFilterStatus)}
            >
              <option value="all">{copy.statusAll}</option>
              <option value="scheduled">{copy.statuses.scheduled}</option>
              <option value="present">{copy.statuses.present}</option>
              <option value="late">{copy.statuses.late}</option>
              <option value="absent">{copy.statuses.absent}</option>
              <option value="checked_out">{copy.statuses.checked_out}</option>
            </select>
          </label>
          <label>
            {copy.lateThresholdLabel}
            <input
              type="number"
              min={1}
              value={lateThresholdMinutes}
              onChange={(event) => onSetLateThresholdMinutes(event.target.value)}
            />
          </label>
          <label>
            {copy.criticalThresholdLabel}
            <input
              type="number"
              min={1}
              value={criticalThresholdMinutes}
              onChange={(event) => onSetCriticalThresholdMinutes(event.target.value)}
            />
          </label>
          <label className="full">
            {copy.searchLabel}
            <input value={searchQuery} onChange={(event) => onSetSearchQuery(event.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onSetToday}>
            {copy.todayButton}
          </button>
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshDisabled}>
            {copy.refreshButton}
          </button>
        </div>
        {pendingLabel ? <p className="small muted">{pendingLabel}</p> : null}
      </article>
    </section>
  );
}

type SummaryCardsProps = {
  copy: AttendanceLiveCopy;
  summary: AttendanceLiveSummary;
};

export function AdminAttendanceLiveSummaryCards({ copy, summary }: SummaryCardsProps) {
  return (
    <section className="kpi-strip">
      <article className="kpi-card"><p>{copy.cards.totalScheduled}</p><strong>{summary.totalScheduled}</strong></article>
      <article className="kpi-card"><p>{copy.cards.present}</p><strong>{summary.presentCount}</strong></article>
      <article className="kpi-card"><p>{copy.cards.late}</p><strong>{summary.lateCount}</strong></article>
      <article className="kpi-card"><p>{copy.cards.absent}</p><strong>{summary.absentCount}</strong></article>
      <article className="kpi-card"><p>{copy.cards.checkedOut}</p><strong>{summary.checkedOutCount}</strong></article>
      <article className="kpi-card"><p>{copy.cards.watchAlerts}</p><strong>{summary.watchCount}</strong></article>
      <article className="kpi-card"><p>{copy.cards.criticalAlerts}</p><strong>{summary.criticalCount}</strong></article>
    </section>
  );
}

type TablePanelProps = {
  copy: AttendanceLiveCopy;
  rows: AttendanceLiveRow[];
  locale: string;
};

export function AdminAttendanceLiveTablePanel({ copy, rows, locale }: TablePanelProps) {
  return (
    <article className="panel">
      <h2>{copy.tableTitle}</h2>
      {rows.length === 0 ? (
        <p className="small muted">{copy.tableNoRows}</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="attendance-live-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Schedule</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Late</th>
                <th>Status</th>
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.scheduleId}>
                  <td>{row.employeeName ?? row.employeeId}</td>
                  <td>{row.departmentName ?? "-"}</td>
                  <td>
                    {formatDateTime(row.scheduleStartAt, locale)}<br />
                    <span className="muted">{formatDateTime(row.scheduleEndAt, locale)}</span>
                  </td>
                  <td>{formatDateTime(row.checkInAt, locale)}</td>
                  <td>{formatDateTime(row.checkOutAt, locale)}</td>
                  <td>{formatMinutes(row.minutesLate)}</td>
                  <td>
                    <span className={`attendance-live-status status-${row.status}`}>
                      {copy.statuses[row.status]}
                    </span>
                  </td>
                  <td>
                    <span className={`attendance-live-alert alert-${row.alertLevel}`}>
                      {row.alertLevel === "critical"
                        ? copy.alertCritical
                        : row.alertLevel === "watch"
                          ? copy.alertWatch
                          : copy.alertNormal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </article>
  );
}

type LogsPanelProps = {
  copy: AttendanceLiveCopy;
  logs: AttendanceLiveApiLog[];
};

export function AdminAttendanceLiveLogsPanel({ copy, logs }: LogsPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.logsTitle}</h2>
      {logs.length === 0 ? (
        <p className="small muted">{copy.logsEmpty}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status} / {log.durationMs}ms / {log.at}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
