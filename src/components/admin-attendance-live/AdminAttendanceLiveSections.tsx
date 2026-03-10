import type { CSSProperties } from "react";

import type {
  AttendanceLiveRow,
  AttendanceLiveStatus,
  AttendanceLiveSummary
} from "@/features/admin-attendance-live/summary";

import type { AttendanceLiveCopy } from "@/components/admin-attendance-live/copy";
import { formatDateTime, formatMinutes } from "@/components/admin-attendance-live/helpers";
import { formatEmployeeDisplayName, formatPublicEmployeeNumber } from "@/lib/product-language";

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
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionActorId: string;
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
    showDevTools,
    sessionOrganizationId,
    sessionActorId,
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
        {showDevTools ? (
          <p className="small muted">
            {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.adminActorIdLabel}:{" "}
            <code>{sessionActorId || "-"}</code>
          </p>
        ) : null}
        <div className="input-grid">
          <label>{copy.periodStartLabel}<input type="datetime-local" value={periodStart} onChange={(event) => onSetPeriodStart(event.target.value)} /></label>
          <label>{copy.periodEndLabel}<input type="datetime-local" value={periodEnd} onChange={(event) => onSetPeriodEnd(event.target.value)} /></label>
          <label>
            {copy.departmentLabel}
            <select value={departmentFilter} onChange={(event) => onSetDepartmentFilter(event.target.value)}>
              <option value="">{copy.departmentAll}</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </select>
          </label>
          <label>
            {copy.statusLabel}
            <select value={statusFilter} onChange={(event) => onSetStatusFilter(event.target.value as AttendanceLiveFilterStatus)}>
              <option value="all">{copy.statusAll}</option>
              <option value="scheduled">{copy.statuses.scheduled}</option>
              <option value="present">{copy.statuses.present}</option>
              <option value="late">{copy.statuses.late}</option>
              <option value="absent">{copy.statuses.absent}</option>
              <option value="checked_out">{copy.statuses.checked_out}</option>
            </select>
          </label>
          <label>{copy.lateThresholdLabel}<input type="number" min={1} value={lateThresholdMinutes} onChange={(event) => onSetLateThresholdMinutes(event.target.value)} /></label>
          <label>{copy.criticalThresholdLabel}<input type="number" min={1} value={criticalThresholdMinutes} onChange={(event) => onSetCriticalThresholdMinutes(event.target.value)} /></label>
          <label className="full">{copy.searchLabel}<input value={searchQuery} onChange={(event) => onSetSearchQuery(event.target.value)} /></label>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={onSetToday}>{copy.todayButton}</button>
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshDisabled}>{copy.refreshButton}</button>
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
          <table style={TABLE_STYLE}>
            <thead>
              <tr>
                <th style={CELL_STYLE}>{copy.tableHeaders.employee}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.department}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.schedule}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.checkIn}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.checkOut}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.late}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.status}</th>
                <th style={CELL_STYLE}>{copy.tableHeaders.alert}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.scheduleId}>
                  <td style={CELL_STYLE}>
                    {formatEmployeeDisplayName(row.employeeName, locale)}
                    <br />
                    <span className="muted">{formatPublicEmployeeNumber(row.employeeId)}</span>
                  </td>
                  <td style={CELL_STYLE}>{row.departmentName ?? "-"}</td>
                  <td style={CELL_STYLE}>{formatDateTime(row.scheduleStartAt, locale)}<br /><span className="muted">{formatDateTime(row.scheduleEndAt, locale)}</span></td>
                  <td style={CELL_STYLE}>{formatDateTime(row.checkInAt, locale)}</td>
                  <td style={CELL_STYLE}>{formatDateTime(row.checkOutAt, locale)}</td>
                  <td style={CELL_STYLE}>{formatMinutes(row.minutesLate)}</td>
                  <td style={CELL_STYLE}><span style={statusBadgeStyle(row.status)}>{copy.statuses[row.status]}</span></td>
                  <td style={CELL_STYLE}><span style={alertBadgeStyle(row.alertLevel)}>{row.alertLevel === "critical" ? copy.alertCritical : row.alertLevel === "watch" ? copy.alertWatch : copy.alertNormal}</span></td>
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
      {logs.length === 0 ? <p className="small muted">{copy.logsEmpty}</p> : (
        <ul className="log-list">
          {logs.map((log) => <li key={log.id}><span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.logSuccessLabel : copy.logFailLabel}</span> {log.label} / {log.status} / {log.durationMs}ms / {log.at}</li>)}
        </ul>
      )}
    </article>
  );
}

const TABLE_STYLE: CSSProperties = { width: "100%", borderCollapse: "collapse" };
const CELL_STYLE: CSSProperties = {
  padding: 10,
  borderBottom: "1px solid var(--line)",
  textAlign: "left",
  verticalAlign: "top",
  whiteSpace: "nowrap"
};

const BADGE_BASE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 76,
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600
};
const BADGE_NORMAL_STYLE: CSSProperties = { ...BADGE_BASE_STYLE, color: "var(--muted)", background: "color-mix(in srgb, var(--panel-soft) 70%, white 30%)" };
const BADGE_WARNING_STYLE: CSSProperties = { ...BADGE_BASE_STYLE, color: "#915b00", background: "#fff1d8" };
const BADGE_CRITICAL_STYLE: CSSProperties = { ...BADGE_BASE_STYLE, color: "#9f1f21", background: "#ffe4e4" };
const BADGE_OK_STYLE: CSSProperties = { ...BADGE_BASE_STYLE, color: "#18603b", background: "#daf8e6" };

function statusBadgeStyle(status: AttendanceLiveStatus): CSSProperties {
  if (status === "late") {
    return BADGE_WARNING_STYLE;
  }
  if (status === "absent") {
    return BADGE_CRITICAL_STYLE;
  }
  if (status === "present" || status === "checked_out") {
    return BADGE_OK_STYLE;
  }
  return BADGE_NORMAL_STYLE;
}

function alertBadgeStyle(level: "normal" | "watch" | "critical"): CSSProperties {
  if (level === "watch") {
    return BADGE_WARNING_STYLE;
  }
  if (level === "critical") {
    return BADGE_CRITICAL_STYLE;
  }
  return BADGE_NORMAL_STYLE;
}
