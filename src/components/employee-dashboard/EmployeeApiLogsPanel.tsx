import type { EmployeeAttendanceLeavePanelsProps } from "@/components/employee-dashboard/EmployeeAttendanceLeavePanels";

export function EmployeeApiLogsPanel({
  sectionTitles,
  apiLogsCopy,
  listBadgeLabels,
  pendingLabel,
  logs,
  stats,
  latestPayload,
  onClearLogs
}: EmployeeAttendanceLeavePanelsProps) {
  return (
    <article className="panel panel-log">
      <h2>{sectionTitles.apiLogs}</h2>
      <p className="small">
        {apiLogsCopy.runningNow}: <strong>{pendingLabel ?? apiLogsCopy.none}</strong> / {apiLogsCopy.totalCalls} {stats.total}
        {apiLogsCopy.summary(stats.success, stats.fail)}
      </p>
      <div className="actions">
        <button className="btn btn-secondary" onClick={onClearLogs} disabled={logs.length === 0}>
          {apiLogsCopy.clearLogs}
        </button>
      </div>
      <pre>{latestPayload}</pre>
      <ul className="log-list">
        {logs.map((log) => (
          <li key={log.id}>
            <span className={log.ok ? "ok" : "fail"}>
              {log.ok ? listBadgeLabels.success : listBadgeLabels.fail} {log.status}
            </span>
            <span>
              {log.label} ({Math.max(0, Math.round(log.durationMs))}ms)
            </span>
            <time>{log.at}</time>
          </li>
        ))}
      </ul>
    </article>
  );
}
