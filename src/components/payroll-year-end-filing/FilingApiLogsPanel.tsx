import Link from "next/link";

import { withAdminSource } from "@/app/admin/source-context";
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
  showPayrollSource: boolean;
};

export default function FilingApiLogsPanel(props: FilingApiLogsPanelProps) {
  const { copy, stats, pendingLabel, logs, showPayrollSource } = props;
  const filingOpsHref = showPayrollSource
    ? withAdminSource("/admin/payroll-year-end-filing/ops", "admin-payroll")
    : "/admin/payroll-year-end-filing/ops";
  const yearEndHref = showPayrollSource
    ? withAdminSource("/admin/payroll-year-end", "admin-payroll")
    : "/admin/payroll-year-end";

  return (
    <article className="panel workspace-section-card workspace-note-card v2-surface-card admin-payroll-diagnostics-card">
      <p className="eyebrow admin-payroll-diagnostics-eyebrow">{copy.apiLogsPanelEyebrow}</p>
      <h2>{copy.apiLogsPanelTitle}</h2>
      <p className="small muted">{copy.apiLogsPanelDescription}</p>
      <div className="admin-payroll-diagnostics-summary" aria-label={copy.apiLogsPanelTitle}>
        <div className="admin-payroll-diagnostics-pill">
          <span>{copy.apiLogsTotalLabel}</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="admin-payroll-diagnostics-pill">
          <span>{copy.apiLogsSuccessLabel}</span>
          <strong>{stats.success}</strong>
        </div>
        <div className="admin-payroll-diagnostics-pill">
          <span>{copy.apiLogsFailLabel}</span>
          <strong>{stats.fail}</strong>
        </div>
        {pendingLabel ? (
          <div className="admin-payroll-diagnostics-pill">
            <span>{copy.apiLogsRunningLabel}</span>
            <strong>{pendingLabel}</strong>
          </div>
        ) : null}
      </div>
      {logs.length === 0 ? (
        <p className="small">{copy.noApiCallYet}</p>
      ) : (
        <ul className="log-list admin-payroll-diagnostics-list">
          {logs.map((log) => (
            <li key={log.id}>
              <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span>{" "}
              {log.label} / {log.status}
              <time>{log.at}</time>
            </li>
          ))}
        </ul>
      )}
      <div className="panel-actions admin-payroll-diagnostics-actions">
        <Link href={filingOpsHref} className="btn btn-secondary">
          {copy.openFilingOpsDashboardAction}
        </Link>
        <Link href={yearEndHref} className="btn btn-secondary">
          {copy.backToYearEndAction}
        </Link>
        {showPayrollSource ? (
          <Link href="/admin/payroll" className="btn btn-secondary">
            {copy.backToPayrollLaneAction}
          </Link>
        ) : null}
        <Link href="/admin" className="btn btn-secondary">
          {copy.backToAdminAction}
        </Link>
      </div>
    </article>
  );
}
