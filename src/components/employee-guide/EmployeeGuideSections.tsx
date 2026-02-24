import Link from "next/link";

import type { EmployeeGuideChecklistItem } from "@/features/employee-guide/checklist";

import type { EmployeeGuideCopy } from "@/components/employee-guide/copy";

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
  organizationId: string;
  employeeId: string;
  accessToken: string;
  pendingLabel: string | null;
  refreshDisabled: boolean;
  onSetOrganizationId: (value: string) => void;
  onSetEmployeeId: (value: string) => void;
  onSetAccessToken: (value: string) => void;
  onRefresh: () => void;
};

export function EmployeeGuideContextPanel(props: ContextPanelProps) {
  const {
    copy,
    organizationId,
    employeeId,
    accessToken,
    pendingLabel,
    refreshDisabled,
    onSetOrganizationId,
    onSetEmployeeId,
    onSetAccessToken,
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
            {copy.employeeIdLabel}
            <input value={employeeId} onChange={(event) => onSetEmployeeId(event.target.value)} />
          </label>
          <label>
            {copy.accessTokenLabel}
            <input value={accessToken} onChange={(event) => onSetAccessToken(event.target.value)} />
          </label>
        </div>
        <div className="actions">
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
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.journeyTitle}</h2>
        <ol className="simple-list">
          {copy.journeySteps.map((step) => (
            <li key={step}>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </article>

      <article className="panel">
        <h2>{copy.quickActionsTitle}</h2>
        <ul className="simple-list">
          {copy.quickActions.map((action) => (
            <li key={action.href}>
              <span>
                <Link href={action.href}>{action.label}</Link> - {action.description}
              </span>
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
};

export function EmployeeGuideChecklistPanel(props: ChecklistPanelProps) {
  const {
    copy,
    progressPercent,
    checklistItems,
    attendanceRecordCount,
    leaveRequestCount,
    confirmedPayslipCount,
    logs
  } = props;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.checklistTitle}</h2>
        <p className="small">
          {copy.progressLabel}: <strong>{progressPercent}%</strong>
        </p>
        <ul className="simple-list">
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

      <article className="panel">
        <h2>{copy.summaryTitle}</h2>
        <ul className="simple-list">
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

      <article className="panel">
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
                {log.label} /{" "}
                {log.status} / {log.durationMs}ms / {log.at}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
