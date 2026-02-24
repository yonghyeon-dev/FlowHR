import type { ApiLog } from "@/app/admin/page-types";

type LogStatusLabels = {
  success: string;
  fail: string;
};

type AdminDebugLogsPanelProps = {
  showDevTools: boolean;
  isKoLocale: boolean;
  logs: ApiLog[];
  logStatusLabels: LogStatusLabels;
  onClearLogs: () => void;
};

export function AdminDebugLogsPanel({
  showDevTools,
  isKoLocale,
  logs,
  logStatusLabels,
  onClearLogs
}: AdminDebugLogsPanelProps) {
  if (!showDevTools) {
    return null;
  }

  return (
    <article className="panel">
      <h2>디버그 로그</h2>
      <p className="small">개발 모드에서만 노출됩니다. PR/배포 환경에서는 사용자 경험 화면을 우선합니다.</p>
      <div className="actions">
        <button className="btn btn-secondary" onClick={onClearLogs}>
          로그 초기화
        </button>
      </div>
      {logs.length === 0 ? (
        <p className="small muted">아직 호출 이력이 없습니다.</p>
      ) : (
        <ul className="simple-list" aria-label={isKoLocale ? "API 호출 로그" : "API call logs"}>
          {logs.slice(0, 12).map((log) => (
            <li key={log.id}>
              <span>
                <span className={log.ok ? "ok" : "fail"}>
                  {log.ok ? logStatusLabels.success : logStatusLabels.fail} {log.status}
                </span>{" "}
                <strong>{log.label}</strong>{" "}
                <span className="muted">
                  {log.durationMs}ms · {log.at}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
