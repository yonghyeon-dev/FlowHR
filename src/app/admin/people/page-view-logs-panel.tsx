import { type ApiLog } from "@/app/admin/people/page-types";

type AdminPeopleLogsPanelProps = {
  isKoLocale: boolean;
  stats: { total: number; success: number; fail: number };
  pendingLabel: string | null;
  logs: ApiLog[];
};

export function AdminPeopleLogsPanel({
  isKoLocale,
  stats,
  pendingLabel,
  logs
}: AdminPeopleLogsPanelProps) {
  return (
    <article className="panel">
      <h2>{isKoLocale ? "요청 로그" : "Request logs"}</h2>
      <p className="small">
        {isKoLocale ? "총" : "Total"} {stats.total}
        {isKoLocale ? "건 · 성공" : " · success"} {stats.success}
        {isKoLocale ? "건 · 실패" : " · fail"} {stats.fail}
        {isKoLocale ? "건" : ""}
        {pendingLabel ? ` · ${isKoLocale ? "진행 중" : "running"} ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small muted">{isKoLocale ? "아직 API 호출 이력이 없습니다." : "No API call history yet."}</p>
      ) : (
        <ul className="log-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>
                {log.ok ? (isKoLocale ? "성공" : "OK") : isKoLocale ? "실패" : "FAIL"}
              </span>
              <span>{log.label}</span>
              <span className="muted">
                {log.status} · {log.at}
              </span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
