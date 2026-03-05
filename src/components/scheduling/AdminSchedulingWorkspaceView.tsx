import type { AdminSchedulingCopy } from "@/components/scheduling/copy";
import type { ScheduleApiLog, WorkScheduleDto } from "@/components/scheduling/helpers";
import type { AdminSchedulingIncidentPanelState } from "@/components/scheduling/use-admin-scheduling-incident-panel";
import AdminSchedulingIncidentPanel from "@/components/scheduling/AdminSchedulingIncidentPanel";
import { formatDateTime } from "@/components/scheduling/helpers";

type AdminSchedulingWorkspaceViewProps = {
  copy: AdminSchedulingCopy;
  runtimeLocale: string;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  showDevTools: boolean;
  statusMessage: string;
  pendingLabel: string | null;
  logStats: { total: number; success: number; fail: number };
  logs: ScheduleApiLog[];
  incidentPanel: AdminSchedulingIncidentPanelState;
  schedules: WorkScheduleDto[];
  selectedSchedule: WorkScheduleDto | null;
  sessionOrganizationId: string;
  sessionActorId: string;
  queryEmployeeId: string;
  fromDate: string;
  toDate: string;
  createEmployeeId: string;
  createStartAt: string;
  createEndAt: string;
  createBreakMinutes: string;
  createIsHoliday: string;
  createNotes: string;
  editStartAt: string;
  editEndAt: string;
  editBreakMinutes: string;
  editIsHoliday: string;
  editNotes: string;
  onQueryEmployeeIdChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onCreateEmployeeIdChange: (value: string) => void;
  onCreateStartAtChange: (value: string) => void;
  onCreateEndAtChange: (value: string) => void;
  onCreateBreakMinutesChange: (value: string) => void;
  onCreateIsHolidayChange: (value: string) => void;
  onCreateNotesChange: (value: string) => void;
  onEditStartAtChange: (value: string) => void;
  onEditEndAtChange: (value: string) => void;
  onEditBreakMinutesChange: (value: string) => void;
  onEditIsHolidayChange: (value: string) => void;
  onEditNotesChange: (value: string) => void;
  onLoadSchedules: () => void;
  onCreateSchedule: () => void;
  onSeedDefaultSchedules: () => void;
  onSelectSchedule: (scheduleId: string) => void;
  onUpdateSelectedSchedule: () => void;
  onDeleteSelectedSchedule: () => void;
};

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
          {showDevTools ? (
            <p className="small muted">
              {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.actorIdLabel}:{" "}
              <code>{sessionActorId || "-"}</code>
            </p>
          ) : null}
          {isProductionRuntime && !usesBearerToken ? (
            <p className="small fail">
              {copy.loadErrorPrefix}. <a href="/login">/login</a>
            </p>
          ) : null}
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
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
        </article>
        <article className="panel">
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
        <article className="panel">
          <h2>{copy.listTitle}</h2>
          {schedules.length === 0 ? (
            <>
              <p className="small muted">{copy.listEmpty}</p>
              {queryEmployeeId.trim() ? (
                <div className="actions">
                  <button className="btn btn-secondary" type="button" onClick={onSeedDefaultSchedules}>
                    {copy.defaultSeedAction}
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
        <article className="panel">
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
        ) : null}
      </section>
    </main>
  );
}
