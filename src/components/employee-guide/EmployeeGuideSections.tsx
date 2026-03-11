import Link from "next/link";

import type { EmployeeGuideChecklistItem } from "@/features/employee-guide/checklist";

import type { EmployeeGuideCopy } from "@/components/employee-guide/copy";
import { formatPublicEmployeeNumber } from "@/lib/product-language";

export type EmployeeGuideApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
  durationMs: number;
};

type ContextPanelProps = {
  copy: EmployeeGuideCopy;
  employeeId: string;
  showDevTools: boolean;
  pendingLabel: string | null;
  refreshDisabled: boolean;
  isKoLocale: boolean;
  onRefresh: () => void;
};

export function EmployeeGuideContextPanel(props: ContextPanelProps) {
  const { copy, employeeId, showDevTools, pendingLabel, refreshDisabled, isKoLocale, onRefresh } =
    props;

  return (
    <section className="panel-grid workspace-panel-grid">
      <article className="panel workspace-section-card workspace-toolbar-card">
        <h2>{copy.contextTitle}</h2>
        <div className="employee-guide-context-grid">
          {showDevTools ? (
            <article className="employee-guide-context-card">
              <p className="small muted">
                {isKoLocale
                  ? "\uB85C\uADF8\uC778\uB41C \uC9C1\uC6D0 \uBC88\uD638"
                  : "Signed-in employee number"}
              </p>
              <strong>
                <code>{formatPublicEmployeeNumber(employeeId)}</code>
              </strong>
            </article>
          ) : null}
          <article className="employee-guide-context-card">
            <p className="small muted">
              {isKoLocale
                ? "\uAC00\uC774\uB4DC \uC0C1\uD0DC\uB97C \uC0C8\uB85C\uACE0\uCE68\uD55C \uB4A4 \uBC14\uB85C \uD544\uC694\uD55C \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uB85C \uC774\uB3D9\uD558\uC138\uC694."
                : "Refresh the guide status and jump straight into the workspace you need."}
            </p>
            <strong>
              {pendingLabel ??
                (isKoLocale
                  ? "\uCD5C\uADFC \uC0C1\uD0DC\uAC00 \uC900\uBE44\uB418\uC5C8\uC2B5\uB2C8\uB2E4."
                  : "Latest guide snapshot is ready.")}
            </strong>
          </article>
        </div>
        <div className="actions employee-guide-context-actions">
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshDisabled}>
            {copy.loadButton}
          </button>
        </div>
        {pendingLabel ? <p className="small muted">{pendingLabel}</p> : null}
      </article>
    </section>
  );
}

type QuickActionsPanelProps = {
  copy: EmployeeGuideCopy;
};

export function EmployeeGuideQuickActionsPanel(props: QuickActionsPanelProps) {
  const { copy } = props;

  return (
    <section className="panel-grid workspace-panel-grid">
      <article className="panel workspace-section-card employee-guide-journey-card">
        <h2>{copy.journeyTitle}</h2>
        <ol className="simple-list employee-guide-journey-list">
          {copy.journeySteps.map((step) => (
            <li key={step}>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </article>

      <article className="panel workspace-section-card employee-guide-actions-card">
        <h2>{copy.quickActionsTitle}</h2>
        <ul className="employee-guide-action-grid">
          {copy.quickActions.map((action) => (
            <li key={action.href} className="employee-guide-action-item">
              <div>
                <strong>{action.label}</strong>
                <p>{action.description}</p>
              </div>
              <Link className="btn btn-secondary" href={action.href}>
                {copy.loadButton}
              </Link>
            </li>
          ))}
        </ul>
      </article>
    </section>
  );
}

type ChecklistPanelProps = {
  copy: EmployeeGuideCopy;
  progressPercent: number;
  checklistItems: EmployeeGuideChecklistItem[];
  attendanceRecordCount: number;
  leaveRequestCount: number;
  confirmedPayslipCount: number;
  logs: EmployeeGuideApiLog[];
  showDevTools: boolean;
};

export function EmployeeGuideChecklistPanel(props: ChecklistPanelProps) {
  const {
    copy,
    progressPercent,
    checklistItems,
    attendanceRecordCount,
    leaveRequestCount,
    confirmedPayslipCount,
    logs,
    showDevTools
  } = props;

  return (
    <section className="panel-grid workspace-panel-grid">
      <article className="panel workspace-section-card employee-guide-checklist-card">
        <h2>{copy.checklistTitle}</h2>
        <p className="small">
          {copy.progressLabel}: <strong>{progressPercent}%</strong>
        </p>
        <ul className="simple-list employee-guide-checklist-list">
          {checklistItems.map((item) => (
            <li key={item.key}>
              <span>
                <span className={item.done ? "ok" : "fail"}>
                  {item.done ? copy.doneLabel : copy.todoLabel}
                </span>{" "}
                {item.key === "profile"
                  ? copy.checklist.profile
                  : item.key === "attendance"
                    ? copy.checklist.attendance
                    : item.key === "leave"
                      ? copy.checklist.leave
                      : copy.checklist.payslip}
              </span>
            </li>
          ))}
        </ul>
      </article>

      <article className="panel workspace-section-card employee-guide-summary-card">
        <h2>{copy.summaryTitle}</h2>
        <ul className="simple-list employee-guide-summary-list">
          <li>
            <span>{copy.summary.attendance}</span>
            <strong>{attendanceRecordCount}</strong>
          </li>
          <li>
            <span>{copy.summary.leave}</span>
            <strong>{leaveRequestCount}</strong>
          </li>
          <li>
            <span>{copy.summary.payslip}</span>
            <strong>{confirmedPayslipCount}</strong>
          </li>
        </ul>
      </article>

      {showDevTools ? (
        <article className="panel workspace-section-card employee-guide-logs-card">
          <h2>{copy.logsTitle}</h2>
          {logs.length === 0 ? (
            <p className="small muted">{copy.logsEmpty}</p>
          ) : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>
                    {log.ok ? copy.okLabel : copy.failLabel}
                  </span>{" "}
                  {log.label} / {log.status} / {log.durationMs}ms / {log.at}
                </li>
              ))}
            </ul>
          )}
        </article>
      ) : null}
    </section>
  );
}
