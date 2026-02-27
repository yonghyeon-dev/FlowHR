import Link from "next/link";

import type { PayrollYearEndFilingCopy } from "@/components/payroll-year-end-filing/copy";
import type { ApiLog } from "@/components/payroll-year-end-filing/types";

type FilingApiLogsPanelProps = {
  copy: PayrollYearEndFilingCopy;
  stats: {
    total: number;
    success: number;
    fail: number;
  };
  pendingLabel: string | null;
  logs: ApiLog[];
};

export default function FilingApiLogsPanel(props: FilingApiLogsPanelProps) {
  const { copy, stats, pendingLabel, logs } = props;

  return (
    <article className="panel">
      <h2>{copy.apiLogsPanelTitle}</h2>
      <p className="small">
        {copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} /{" "}
        {copy.apiLogsFailLabel} {stats.fail}
        {pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}
      </p>
      {logs.length === 0 ? (
        <p className="small">{copy.noApiCallYet}</p>
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
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary">
          {copy.openFilingOpsDashboardAction}
        </Link>
        <Link href="/admin/payroll-year-end" className="btn btn-secondary">
          {copy.backToYearEndAction}
        </Link>
        <Link href="/admin" className="btn btn-secondary">
          {copy.backToAdminAction}
        </Link>
      </div>
    </article>
  );
}
