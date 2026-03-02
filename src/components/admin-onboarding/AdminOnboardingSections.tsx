import type { OnboardingChecklistItem } from "@/features/admin-onboarding/checklist";
import type { AdminOnboardingCopy } from "@/components/admin-onboarding/copy";
export type AdminOnboardingOrganizationOption = { id: string; name: string };
export type AdminOnboardingDepartmentOption = { id: string; code: string; name: string };
export type AdminOnboardingActionLog = { id: number; label: string; ok: boolean; status: number; at: string; durationMs: number };
type ContextPanelProps = {
  copy: AdminOnboardingCopy;
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionActorId: string;
  pendingLabel: string | null;
  refreshDisabled: boolean;
  onRefresh: () => void;
};
export function AdminOnboardingContextPanel(props: ContextPanelProps) {
  const {
    copy,
    showDevTools,
    sessionOrganizationId,
    sessionActorId,
    pendingLabel,
    refreshDisabled,
    onRefresh
  } = props;
  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.contextTitle}</h2>
        {showDevTools ? (
          <p className="small muted">
            {copy.organizationIdLabel}: <code>{sessionOrganizationId || "-"}</code> / {copy.adminActorIdLabel}:{" "}
            <code>{sessionActorId || "-"}</code>
          </p>
        ) : null}
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
  showDevTools: boolean;
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
  activeEmployeeCount: number;
  inviteEligibleEmployeeCount: number;
  invitedEmployeeCount: number;
  pendingInviteCount: number;
  activeContractTemplateCount: number;
  preparedContractDraftEmployeeCount: number;
  pendingContractDraftCount: number;
  approvalRequestedContractEmployeeCount: number;
  pendingContractApprovalRequestCount: number;
  approvedContractEmployeeCount: number;
  pendingContractApprovalDecisionCount: number;
  sentContractEmployeeCount: number;
  pendingContractSendCount: number;
  respondedContractEmployeeCount: number; pendingContractResponseCount: number;
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
  onIssuePendingEmployeeInvites: () => void;
  onBootstrapEmploymentContractTemplate: () => void;
  onCreatePendingContractDrafts: () => void;
  onRequestPendingContractApprovals: () => void;
  onApprovePendingContractApprovals: () => void;
  onSendPendingContracts: () => void; onOpenPendingContractResponses: () => void;
};
export function AdminOnboardingSetupPanels(props: SetupPanelsProps) {
  const {
    copy,
    showDevTools,
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
    activeEmployeeCount,
    inviteEligibleEmployeeCount,
    invitedEmployeeCount,
    pendingInviteCount,
    activeContractTemplateCount,
    preparedContractDraftEmployeeCount,
    pendingContractDraftCount,
    approvalRequestedContractEmployeeCount,
    pendingContractApprovalRequestCount,
    approvedContractEmployeeCount,
    pendingContractApprovalDecisionCount,
    sentContractEmployeeCount,
    pendingContractSendCount,
    respondedContractEmployeeCount,
    pendingContractResponseCount,
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
    onApplyLeavePolicy,
    onIssuePendingEmployeeInvites,
    onBootstrapEmploymentContractTemplate,
    onCreatePendingContractDrafts,
    onRequestPendingContractApprovals,
    onApprovePendingContractApprovals,
    onSendPendingContracts,
    onOpenPendingContractResponses
  } = props;
  return (
    <section className="panel-grid">
      <article className="panel">
        <h2>{copy.organizationSelectTitle}</h2>
        {showDevTools ? (
          <p className="small muted">
            {copy.organizationIdLabel}: <code>{organizationId || "-"}</code>
          </p>
        ) : null}
        {organizations.length > 0 ? (
          <ul className="simple-list">
            {organizations.map((organization) => (
              <li key={organization.id}>
                <span>
                  <strong>{organization.name}</strong>
                  {showDevTools ? ` (${organization.id})` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
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
        <h2>{copy.inviteCoverageTitle}</h2>
        <p className="small muted">{copy.inviteCoverageDescription}</p>
        <p className="small">
          {copy.inviteCoverageEligibleLabel}: <strong>{inviteEligibleEmployeeCount}</strong> /{" "}
          {copy.inviteCoverageSentLabel}: <strong>{invitedEmployeeCount}</strong> /{" "}
          {copy.inviteCoveragePendingLabel}: <strong>{pendingInviteCount}</strong>{" "}
          <span className={pendingInviteCount === 0 && inviteEligibleEmployeeCount > 0 ? "ok" : "fail"}>
            {pendingInviteCount === 0 && inviteEligibleEmployeeCount > 0 ? copy.inviteCoverageReadyLabel : copy.inviteCoverageMissingLabel}
          </span>
        </p>
        <div className="actions">
          <button className="btn btn-primary" onClick={onIssuePendingEmployeeInvites} disabled={pendingInviteCount === 0 || inviteEligibleEmployeeCount === 0}>{copy.inviteCoverageIssueButton}</button>
        </div>
        <p className="small muted">{copy.inviteCoverageIssueHint}</p>
      </article>
      <article className="panel">
        <h2>{copy.leavePolicyTitle}</h2>
        <div className="input-grid">
          <label>{copy.leavePolicyFields.annualGrantDays}<input type="number" min={1} value={annualGrantDays} onChange={(event) => onSetAnnualGrantDays(event.target.value)} /></label>
          <label>{copy.leavePolicyFields.carryOverCapDays}<input type="number" min={0} value={carryOverCapDays} onChange={(event) => onSetCarryOverCapDays(event.target.value)} /></label>
          <label>
            {copy.leavePolicyFields.allowHalfDay}
            <select value={allowHalfDay ? "true" : "false"} onChange={(event) => onSetAllowHalfDay(event.target.value === "true")}>
              <option value="true">{copy.leavePolicyFields.enabled}</option>
              <option value="false">{copy.leavePolicyFields.disabled}</option>
            </select>
          </label>
          <label>
            {copy.leavePolicyFields.allowHourly}
            <select value={allowHourly ? "true" : "false"} onChange={(event) => onSetAllowHourly(event.target.value === "true")}>
              <option value="true">{copy.leavePolicyFields.enabled}</option>
              <option value="false">{copy.leavePolicyFields.disabled}</option>
            </select>
          </label>
          <label>{copy.leavePolicyFields.hourlyIncrementMinutes}<input type="number" min={15} step={15} value={hourlyIncrementMinutes} onChange={(event) => onSetHourlyIncrementMinutes(event.target.value)} /></label>
          <label>{copy.leavePolicyFields.maxHoursPerRequest}<input type="number" min={1} max={24} value={maxHoursPerRequest} onChange={(event) => onSetMaxHoursPerRequest(event.target.value)} /></label>
        </div>
        <div className="actions"><button className="btn btn-primary" onClick={onApplyLeavePolicy}>{copy.applyLeavePolicyButton}</button></div>
      </article>
      <article className="panel">
        <h2>{copy.contractTemplateTitle}</h2>
        <p className="small muted">{copy.contractTemplateDescription}</p>
        <p className="small">{copy.contractTemplateCountLabel}: <strong>{activeContractTemplateCount}</strong>{" "} <span className={activeContractTemplateCount > 0 ? "ok" : "fail"}>{activeContractTemplateCount > 0 ? copy.contractTemplateReadyLabel : copy.contractTemplateMissingLabel}</span></p>
        <p className="small">{copy.contractDraftCoverageLabel}: <strong>{preparedContractDraftEmployeeCount}</strong> / <strong>{activeEmployeeCount}</strong> · {copy.contractDraftPendingLabel}: <strong>{pendingContractDraftCount}</strong>{" "} <span className={pendingContractDraftCount === 0 && activeEmployeeCount > 0 ? "ok" : "fail"}>{pendingContractDraftCount === 0 && activeEmployeeCount > 0 ? copy.contractDraftReadyLabel : copy.contractDraftMissingLabel}</span></p>
        <p className="small">{copy.contractApprovalCoverageLabel}: <strong>{approvalRequestedContractEmployeeCount}</strong> / <strong>{preparedContractDraftEmployeeCount}</strong> · {copy.contractApprovalPendingLabel}: <strong>{pendingContractApprovalRequestCount}</strong>{" "} <span className={pendingContractApprovalRequestCount === 0 && preparedContractDraftEmployeeCount > 0 ? "ok" : "fail"}>{pendingContractApprovalRequestCount === 0 && preparedContractDraftEmployeeCount > 0 ? copy.contractApprovalReadyLabel : copy.contractApprovalMissingLabel}</span></p>
        <p className="small">{copy.contractApprovalDecisionCoverageLabel}: <strong>{approvedContractEmployeeCount}</strong> / <strong>{approvalRequestedContractEmployeeCount}</strong> · {copy.contractApprovalDecisionPendingLabel}: <strong>{pendingContractApprovalDecisionCount}</strong>{" "} <span className={pendingContractApprovalDecisionCount === 0 && approvalRequestedContractEmployeeCount > 0 ? "ok" : "fail"}>{pendingContractApprovalDecisionCount === 0 && approvalRequestedContractEmployeeCount > 0 ? copy.contractApprovalDecisionReadyLabel : copy.contractApprovalDecisionMissingLabel}</span></p>
        <p className="small">{copy.contractSendCoverageLabel}: <strong>{sentContractEmployeeCount}</strong> / <strong>{approvedContractEmployeeCount}</strong> · {copy.contractSendPendingLabel}: <strong>{pendingContractSendCount}</strong>{" "} <span className={pendingContractSendCount === 0 && approvedContractEmployeeCount > 0 ? "ok" : "fail"}>{pendingContractSendCount === 0 && approvedContractEmployeeCount > 0 ? copy.contractSendReadyLabel : copy.contractSendMissingLabel}</span></p>
        <p className="small">{copy.contractResponseCoverageLabel}: <strong>{respondedContractEmployeeCount}</strong> / <strong>{sentContractEmployeeCount}</strong> · {copy.contractResponsePendingLabel}: <strong>{pendingContractResponseCount}</strong>{" "} <span className={pendingContractResponseCount === 0 && sentContractEmployeeCount > 0 ? "ok" : "fail"}>{pendingContractResponseCount === 0 && sentContractEmployeeCount > 0 ? copy.contractResponseReadyLabel : copy.contractResponseMissingLabel}</span></p>
        <div className="actions">
          <button className="btn btn-primary" onClick={onBootstrapEmploymentContractTemplate} disabled={activeContractTemplateCount > 0}>{copy.contractTemplateBootstrapButton}</button>
          <button className="btn btn-secondary" onClick={onCreatePendingContractDrafts} disabled={activeContractTemplateCount === 0 || pendingContractDraftCount === 0}>{copy.contractDraftIssueButton}</button>
          <button className="btn btn-secondary" onClick={onRequestPendingContractApprovals} disabled={preparedContractDraftEmployeeCount === 0 || pendingContractApprovalRequestCount === 0}>{copy.contractApprovalIssueButton}</button>
          <button className="btn btn-secondary" onClick={onApprovePendingContractApprovals} disabled={approvalRequestedContractEmployeeCount === 0 || pendingContractApprovalDecisionCount === 0}>{copy.contractApprovalDecisionIssueButton}</button>
          <button className="btn btn-secondary" onClick={onSendPendingContracts} disabled={approvedContractEmployeeCount === 0 || pendingContractSendCount === 0}>{copy.contractSendIssueButton}</button>
          <button className="btn btn-secondary" onClick={onOpenPendingContractResponses} disabled={sentContractEmployeeCount === 0 || pendingContractResponseCount === 0}>{copy.contractResponseQueueButton}</button>
        </div>
        <p className="small muted">{copy.contractTemplateBootstrapHint}</p>
        <p className="small muted">{copy.contractDraftIssueHint}</p>
        <p className="small muted">{copy.contractApprovalIssueHint}</p>
        <p className="small muted">{copy.contractApprovalDecisionIssueHint}</p>
        <p className="small muted">{copy.contractSendIssueHint}</p>
        <p className="small muted">{copy.contractResponseQueueHint}</p>
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
        <p className="small">{copy.progressLabel}: <strong>{progressPercent}%</strong></p>
        <ul className="simple-list">
          {checklistItems.map((item) => (
            <li key={item.key}>
              <span>
                <span className={item.done ? "ok" : "fail"}>
                  {item.done ? copy.doneLabel : copy.todoLabel}
                </span>{" "}
                {item.key === "organization" ? copy.checklist.organization : item.key === "departments" ? copy.checklist.departments : item.key === "employees" ? copy.checklist.employees : item.key === "invites" ? copy.checklist.invites : item.key === "leave_policy" ? copy.checklist.leavePolicy : copy.checklist.contracts}
              </span>
            </li>
          ))}
        </ul>
      </article>
      <article className="panel">
        <h2>{copy.logsTitle}</h2>
        {logs.length === 0 ? <p className="small muted">{copy.logsEmpty}</p> : (
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
    </section>
  );
}
