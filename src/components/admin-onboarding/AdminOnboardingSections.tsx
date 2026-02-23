import type { OnboardingChecklistItem } from "@/features/admin-onboarding/checklist";

import type { AdminOnboardingCopy } from "@/components/admin-onboarding/copy";

export type AdminOnboardingOrganizationOption = { id: string; name: string };
export type AdminOnboardingDepartmentOption = { id: string; code: string; name: string };

export type AdminOnboardingActionLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
  durationMs: number;
};

type ContextPanelProps = {
  copy: AdminOnboardingCopy;
  organizationId: string;
  adminActorId: string;
  accessToken: string;
  pendingLabel: string | null;
  refreshDisabled: boolean;
  onSetOrganizationId: (value: string) => void;
  onSetAdminActorId: (value: string) => void;
  onSetAccessToken: (value: string) => void;
  onRefresh: () => void;
};

export function AdminOnboardingContextPanel(props: ContextPanelProps) {
  const {
    copy,
    organizationId,
    adminActorId,
    accessToken,
    pendingLabel,
    refreshDisabled,
    onSetOrganizationId,
    onSetAdminActorId,
    onSetAccessToken,
    onRefresh
  } = props;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.contextTitle}</h2>
        <div className="input-grid">
          <label>{copy.organizationIdLabel}<input value={organizationId} onChange={(event) => onSetOrganizationId(event.target.value)} /></label>
          <label>{copy.adminActorIdLabel}<input value={adminActorId} onChange={(event) => onSetAdminActorId(event.target.value)} /></label>
          <label>{copy.accessTokenLabel}<input value={accessToken} onChange={(event) => onSetAccessToken(event.target.value)} /></label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onRefresh} disabled={refreshDisabled}>{copy.loadButton}</button>
        </div>
        {pendingLabel ? <p className="small muted">{pendingLabel}</p> : null}
      </article>
    </section>
  );
}

type SetupPanelsProps = {
  copy: AdminOnboardingCopy;
  organizationId: string;
  organizations: AdminOnboardingOrganizationOption[];
  departments: AdminOnboardingDepartmentOption[];
  departmentSeedInput: string;
  employeeSeedInput: string;
  annualGrantDays: string;
  carryOverCapDays: string;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: string;
  maxHoursPerRequest: string;
  onSetOrganizationId: (value: string) => void;
  onSetDepartmentSeedInput: (value: string) => void;
  onSetEmployeeSeedInput: (value: string) => void;
  onSetAnnualGrantDays: (value: string) => void;
  onSetCarryOverCapDays: (value: string) => void;
  onSetAllowHalfDay: (value: boolean) => void;
  onSetAllowHourly: (value: boolean) => void;
  onSetHourlyIncrementMinutes: (value: string) => void;
  onSetMaxHoursPerRequest: (value: string) => void;
  onReloadOrganizations: () => void;
  onApplyDepartments: () => void;
  onApplyEmployees: () => void;
  onApplyLeavePolicy: () => void;
};

export function AdminOnboardingSetupPanels(props: SetupPanelsProps) {
  const {
    copy,
    organizationId,
    organizations,
    departments,
    departmentSeedInput,
    employeeSeedInput,
    annualGrantDays,
    carryOverCapDays,
    allowHalfDay,
    allowHourly,
    hourlyIncrementMinutes,
    maxHoursPerRequest,
    onSetOrganizationId,
    onSetDepartmentSeedInput,
    onSetEmployeeSeedInput,
    onSetAnnualGrantDays,
    onSetCarryOverCapDays,
    onSetAllowHalfDay,
    onSetAllowHourly,
    onSetHourlyIncrementMinutes,
    onSetMaxHoursPerRequest,
    onReloadOrganizations,
    onApplyDepartments,
    onApplyEmployees,
    onApplyLeavePolicy
  } = props;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.organizationSelectTitle}</h2>
        <div className="input-grid">
          <label>
            {copy.organizationIdLabel}
            <select value={organizationId} onChange={(event) => onSetOrganizationId(event.target.value)}>
              <option value="">-</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name} ({organization.id})</option>)}
            </select>
          </label>
        </div>
        <div className="actions"><button className="btn btn-secondary" onClick={onReloadOrganizations}>{copy.organizationRefreshButton}</button></div>
      </article>

      <article className="panel">
        <h2>{copy.departmentSeedTitle}</h2>
        <textarea
          value={departmentSeedInput}
          onChange={(event) => onSetDepartmentSeedInput(event.target.value)}
          rows={6}
          placeholder={copy.departmentSeedPlaceholder}
        />
        <div className="actions"><button className="btn btn-primary" onClick={onApplyDepartments}>{copy.applyDepartmentsButton}</button></div>
        {departments.length > 0 ? (
          <ul className="simple-list">
            {departments.map((department) => <li key={department.id}><span><strong>{department.code}</strong> - {department.name}</span></li>)}
          </ul>
        ) : (
          <p className="small muted">-</p>
        )}
      </article>

      <article className="panel">
        <h2>{copy.employeeSeedTitle}</h2>
        <textarea
          value={employeeSeedInput}
          onChange={(event) => onSetEmployeeSeedInput(event.target.value)}
          rows={6}
          placeholder={copy.employeeSeedPlaceholder}
        />
        <div className="actions"><button className="btn btn-primary" onClick={onApplyEmployees}>{copy.applyEmployeesButton}</button></div>
      </article>

      <article className="panel">
        <h2>{copy.leavePolicyTitle}</h2>
        <div className="input-grid">
          <label>Annual grant days<input type="number" min={1} value={annualGrantDays} onChange={(event) => onSetAnnualGrantDays(event.target.value)} /></label>
          <label>Carry-over cap days<input type="number" min={0} value={carryOverCapDays} onChange={(event) => onSetCarryOverCapDays(event.target.value)} /></label>
          <label>Allow half-day<select value={allowHalfDay ? "true" : "false"} onChange={(event) => onSetAllowHalfDay(event.target.value === "true")}><option value="true">true</option><option value="false">false</option></select></label>
          <label>Allow hourly<select value={allowHourly ? "true" : "false"} onChange={(event) => onSetAllowHourly(event.target.value === "true")}><option value="true">true</option><option value="false">false</option></select></label>
          <label>Hourly increment minutes<input type="number" min={15} step={15} value={hourlyIncrementMinutes} onChange={(event) => onSetHourlyIncrementMinutes(event.target.value)} /></label>
          <label>Max hours per request<input type="number" min={1} max={24} value={maxHoursPerRequest} onChange={(event) => onSetMaxHoursPerRequest(event.target.value)} /></label>
        </div>
        <div className="actions"><button className="btn btn-primary" onClick={onApplyLeavePolicy}>{copy.applyLeavePolicyButton}</button></div>
      </article>
    </section>
  );
}

type ChecklistPanelProps = {
  copy: AdminOnboardingCopy;
  progressPercent: number;
  checklistItems: OnboardingChecklistItem[];
  logs: AdminOnboardingActionLog[];
};

export function AdminOnboardingChecklistPanel(props: ChecklistPanelProps) {
  const { copy, progressPercent, checklistItems, logs } = props;

  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.checklistTitle}</h2>
        <p className="small">Progress: <strong>{progressPercent}%</strong></p>
        <ul className="simple-list">
          {checklistItems.map((item) => (
            <li key={item.key}>
              <span>
                <span className={item.done ? "ok" : "fail"}>{item.done ? "DONE" : "TODO"}</span>{" "}
                {item.key === "organization"
                  ? copy.checklist.organization
                  : item.key === "departments"
                    ? copy.checklist.departments
                    : item.key === "employees"
                      ? copy.checklist.employees
                      : copy.checklist.leavePolicy}
              </span>
            </li>
          ))}
        </ul>
      </article>

      <article className="panel">
        <h2>{copy.logsTitle}</h2>
        {logs.length === 0 ? <p className="small muted">{copy.logsEmpty}</p> : (
          <ul className="log-list">
            {logs.map((log) => <li key={log.id}><span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status} / {log.durationMs}ms / {log.at}</li>)}
          </ul>
        )}
      </article>
    </section>
  );
}
