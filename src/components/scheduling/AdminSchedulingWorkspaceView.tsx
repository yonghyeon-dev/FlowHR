import type { AdminSchedulingWorkspaceViewProps } from "@/components/scheduling/AdminSchedulingWorkspaceView.types";
import AdminSchedulingIncidentPanel from "@/components/scheduling/AdminSchedulingIncidentPanel";
import { formatDateTime } from "@/components/scheduling/helpers";
import {
  formatAdminSessionConnectionState,
  formatWorkspaceConnectionState
} from "@/lib/product-language";

export default function AdminSchedulingWorkspaceView(props: AdminSchedulingWorkspaceViewProps) {
  const {
    copy,
    runtimeLocale,
    isProductionRuntime,
    usesBearerToken,
    showDevTools,
    statusMessage,
    pendingLabel,
    logStats,
    logs,
    incidentPanel,
    schedules,
    showSeedDefaultsAction,
    selectedSchedule,
    sessionOrganizationId,
    sessionActorId,
    queryEmployeeId,
    fromDate,
    toDate,
    createEmployeeId,
    createStartAt,
    createEndAt,
    createBreakMinutes,
    createIsHoliday,
    createNotes,
    editStartAt,
    editEndAt,
    editBreakMinutes,
    editIsHoliday,
    editNotes,
    onQueryEmployeeIdChange,
    onFromDateChange,
    onToDateChange,
    onCreateEmployeeIdChange,
    onCreateStartAtChange,
    onCreateEndAtChange,
    onCreateBreakMinutesChange,
    onCreateIsHolidayChange,
    onCreateNotesChange,
    onEditStartAtChange,
    onEditEndAtChange,
    onEditBreakMinutesChange,
    onEditIsHolidayChange,
    onEditNotesChange,
    onLoadSchedules,
    onCreateSchedule,
    onSeedDefaultSchedules,
    onSelectSchedule,
    onUpdateSelectedSchedule,
    onDeleteSelectedSchedule
  } = props;
  const hasWorkspaceSession = sessionOrganizationId.trim().length > 0;
  const hasAdminSession = sessionActorId.trim().length > 0;
  const scheduleCount = schedules.length;
  const holidayCount = schedules.filter((schedule) => schedule.isHoliday).length;
  const selectedCount = selectedSchedule ? 1 : 0;
  const incidentTotal = incidentPanel.incidentSummary.total || incidentPanel.incidentTotal;
  const incidentUnassigned = incidentPanel.incidentSummary.unassigned;
  const statusToneClass = statusMessage.startsWith(copy.loadErrorPrefix)
    ? "small fail workspace-inline-status"
    : "small workspace-inline-status";

  return (
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="hero page-header workspace-page-header">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
          <h2>{copy.filtersTitle}</h2>
          {showDevTools ? (
            <p className="small muted workspace-source-banner">
              {copy.organizationIdLabel}:{" "}
              <strong>{formatWorkspaceConnectionState(hasWorkspaceSession, runtimeLocale)}</strong> /{" "}
              {copy.actorIdLabel}: <strong>{formatAdminSessionConnectionState(hasAdminSession, runtimeLocale)}</strong>
            </p>
          ) : null}
          {isProductionRuntime && !usesBearerToken ? (
            <p className="small fail workspace-inline-status">
              {copy.loadErrorPrefix}. <a href="/login">/login</a>
            </p>
          ) : null}
          <div className="kpi-strip workspace-summary-strip">
            <article className="kpi-card">
              <span>{copy.listTitle}</span>
              <strong>{scheduleCount}</strong>
            </article>
            <article className="kpi-card">
              <span>{copy.holidayLabel}</span>
              <strong>{holidayCount}</strong>
            </article>
            <article className="kpi-card">
              <span>{copy.selectedTitle}</span>
              <strong>{selectedCount}</strong>
            </article>
            <article className="kpi-card">
              <span>{copy.incidentSummaryTotalLabel}</span>
              <strong>{incidentTotal}</strong>
            </article>
            <article className="kpi-card">
              <span>{copy.incidentSummaryUnassignedLabel}</span>
              <strong>{incidentUnassigned}</strong>
            </article>
          </div>
          <label>
            {copy.employeeIdLabel}
            <input value={queryEmployeeId} onChange={(event) => onQueryEmployeeIdChange(event.target.value)} />
          </label>
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
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onLoadSchedules}>
              {copy.loadAction}
            </button>
          </div>
          {statusMessage ? <p className={statusToneClass}>{statusMessage}</p> : null}
        </article>
        <article className="panel workspace-section-card">
          <h2>{copy.createTitle}</h2>
          <label>
            {copy.createEmployeeIdLabel}
            <input value={createEmployeeId} onChange={(event) => onCreateEmployeeIdChange(event.target.value)} />
          </label>
          <div className="input-grid">
            <label>
              {copy.createStartLabel}
              <input
                type="datetime-local"
                value={createStartAt}
                onChange={(event) => onCreateStartAtChange(event.target.value)}
              />
            </label>
            <label>
              {copy.createEndLabel}
              <input type="datetime-local" value={createEndAt} onChange={(event) => onCreateEndAtChange(event.target.value)} />
            </label>
          </div>
          <div className="input-grid">
            <label>
              {copy.createBreakMinutesLabel}
              <input value={createBreakMinutes} onChange={(event) => onCreateBreakMinutesChange(event.target.value)} />
            </label>
            <label>
              {copy.createHolidayLabel}
              <select value={createIsHoliday} onChange={(event) => onCreateIsHolidayChange(event.target.value)}>
                <option value="no">{copy.holidayNo}</option>
                <option value="yes">{copy.holidayYes}</option>
              </select>
            </label>
          </div>
          <label>
            {copy.createNotesLabel}
            <textarea rows={3} value={createNotes} onChange={(event) => onCreateNotesChange(event.target.value)} />
          </label>
          <div className="actions">
            <button className="btn btn-primary" type="button" onClick={onCreateSchedule}>
              {copy.createAction}
            </button>
          </div>
        </article>
        <article className="panel workspace-section-card workspace-note-card">
          <h2>{copy.listTitle}</h2>
          {schedules.length === 0 ? (
            <>
              <p className="small muted">{copy.listEmpty}</p>
              {showSeedDefaultsAction ? (
                <div className="actions">
                  <button
                    className="btn btn-secondary"
                    type="button"
                    disabled={pendingLabel === copy.pendingSeedDefaults}
                    onClick={onSeedDefaultSchedules}
                  >
                    {copy.seedDefaultsAction}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <ul className="simple-list">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span>
                    <strong>{schedule.employeeId}</strong>
                    <br />
                    <span className="small">
                      {copy.periodLabel}: {formatDateTime(schedule.startAt, runtimeLocale)} ~{" "}
                      {formatDateTime(schedule.endAt, runtimeLocale)}
                    </span>
                    <br />
                    <span className="small">
                      {copy.breakLabel}: {schedule.breakMinutes}m / {copy.holidayLabel}:{" "}
                      {schedule.isHoliday ? copy.holidayYes : copy.holidayNo}
                    </span>
                  </span>
                  <button className="btn btn-secondary btn-small" type="button" onClick={() => onSelectSchedule(schedule.id)}>
                    {copy.selectAction}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>
        <AdminSchedulingIncidentPanel copy={copy} runtimeLocale={runtimeLocale} incidentPanel={incidentPanel} />
        <article className="panel workspace-section-card workspace-detail-card">
          <h2>{copy.selectedTitle}</h2>
          {!selectedSchedule ? (
            <p className="small muted">{copy.selectedEmpty}</p>
          ) : (
            <>
              <p className="small">
                {copy.scheduleIdLabel}: <strong>{selectedSchedule.id}</strong>
                <br />
                {copy.updatedAtLabel}: <strong>{formatDateTime(selectedSchedule.updatedAt, runtimeLocale)}</strong>
              </p>
              <div className="input-grid">
                <label>
                  {copy.createStartLabel}
                  <input type="datetime-local" value={editStartAt} onChange={(event) => onEditStartAtChange(event.target.value)} />
                </label>
                <label>
                  {copy.createEndLabel}
                  <input type="datetime-local" value={editEndAt} onChange={(event) => onEditEndAtChange(event.target.value)} />
                </label>
              </div>
              <div className="input-grid">
                <label>
                  {copy.createBreakMinutesLabel}
                  <input value={editBreakMinutes} onChange={(event) => onEditBreakMinutesChange(event.target.value)} />
                </label>
                <label>
                  {copy.createHolidayLabel}
                  <select value={editIsHoliday} onChange={(event) => onEditIsHolidayChange(event.target.value)}>
                    <option value="no">{copy.holidayNo}</option>
                    <option value="yes">{copy.holidayYes}</option>
                  </select>
                </label>
              </div>
              <label>
                {copy.createNotesLabel}
                <textarea rows={3} value={editNotes} onChange={(event) => onEditNotesChange(event.target.value)} />
              </label>
              <div className="actions">
                <button className="btn btn-primary" type="button" onClick={onUpdateSelectedSchedule}>
                  {copy.updateAction}
                </button>
                <button className="btn btn-secondary" type="button" onClick={onDeleteSelectedSchedule}>
                  {copy.deleteAction}
                </button>
              </div>
            </>
          )}
        </article>
        {showDevTools ? (
          <article className="panel workspace-side-panel">
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
        ) : null}
      </section>
    </main>
  );
}
