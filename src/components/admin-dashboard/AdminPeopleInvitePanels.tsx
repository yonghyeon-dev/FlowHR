import type {
  EmployeeSummary,
  InviteDeliveryMode,
  InviteResultDto,
  InviteRole
} from "@/app/admin/page-types";
import {
  formatEmployeeDisplayName,
  formatPublicEmployeeNumber
} from "@/lib/product-language";

type InviteRoleLabels = Record<InviteRole, string>;
type InviteDeliveryModeLabels = Record<InviteDeliveryMode, string>;

type AdminPeopleInvitePanelsProps = {
  isKoLocale: boolean;
  organizationId: string;
  organizationName: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  employeeActive: boolean;
  employees: EmployeeSummary[];
  inviteEmail: string;
  inviteRole: InviteRole;
  inviteDeliveryMode: InviteDeliveryMode;
  inviteActorId: string;
  inviteResult: InviteResultDto | null;
  inviteRoleLabels: InviteRoleLabels;
  inviteDeliveryModeLabels: InviteDeliveryModeLabels;
  toInviteRoleLabel: (role: InviteRole) => string;
  toInviteDeliveryModeLabel: (mode: InviteDeliveryMode) => string;
  onEmployeeIdChange: (value: string) => void;
  onEmployeeNameChange: (value: string) => void;
  onEmployeeEmailChange: (value: string) => void;
  onEmployeeActiveChange: (active: boolean) => void;
  onCreateEmployee: () => void;
  onListEmployees: () => void;
  onApplyEmployee: (employeeId: string) => void;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (role: InviteRole) => void;
  onInviteDeliveryModeChange: (mode: InviteDeliveryMode) => void;
  onInviteActorIdChange: (value: string) => void;
  onCreateInvite: () => void;
};

export function AdminPeopleInvitePanels({
  isKoLocale,
  organizationId,
  organizationName,
  employeeId,
  employeeName,
  employeeEmail,
  employeeActive,
  employees,
  inviteEmail,
  inviteRole,
  inviteDeliveryMode,
  inviteActorId,
  inviteResult,
  inviteRoleLabels,
  inviteDeliveryModeLabels,
  toInviteRoleLabel,
  toInviteDeliveryModeLabel,
  onEmployeeIdChange,
  onEmployeeNameChange,
  onEmployeeEmailChange,
  onEmployeeActiveChange,
  onCreateEmployee,
  onListEmployees,
  onApplyEmployee,
  onInviteEmailChange,
  onInviteRoleChange,
  onInviteDeliveryModeChange,
  onInviteActorIdChange,
  onCreateInvite
}: AdminPeopleInvitePanelsProps) {
  const locale = isKoLocale ? "ko-KR" : "en-US";
  const workspaceLabel = organizationName.trim() || (isKoLocale ? "현재 선택한 워크스페이스" : "Current workspace");
  const workspaceMissingLabel = isKoLocale
    ? "먼저 상단의 조직 온보딩에서 워크스페이스를 선택해 주세요."
    : "Select a workspace in organization onboarding first.";

  return (
    <>
      <article className="panel" id="people">
        <h2>{isKoLocale ? "직원 관리" : "Employee Management"}</h2>
        <p className="small">
          {isKoLocale
            ? "출퇴근, 휴가, 급여 시나리오는 직원 마스터가 있어야 정상 동작합니다. 먼저 직원 정보를 준비해 주세요."
            : "Attendance, leave, and payroll flows require employee master data. Create employees first."}
        </p>
        <div className="input-grid">
          <label>
            {isKoLocale ? "직원 번호" : "Employee number"}
            <input value={employeeId} onChange={(event) => onEmployeeIdChange(event.target.value)} />
          </label>
          <label>
            {isKoLocale ? "이름 (선택)" : "Name (optional)"}
            <input value={employeeName} onChange={(event) => onEmployeeNameChange(event.target.value)} />
          </label>
          <label>
            {isKoLocale ? "이메일 (선택)" : "Email (optional)"}
            <input value={employeeEmail} onChange={(event) => onEmployeeEmailChange(event.target.value)} />
          </label>
          <label>
            {isKoLocale ? "계정 상태" : "Account status"}
            <select value={employeeActive ? "yes" : "no"} onChange={(event) => onEmployeeActiveChange(event.target.value === "yes")}>
              <option value="yes">{isKoLocale ? "사용 중" : "Active"}</option>
              <option value="no">{isKoLocale ? "비활성" : "Inactive"}</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateEmployee} disabled={!employeeId.trim() || !organizationId.trim()}>
            {isKoLocale ? "직원 생성" : "Create employee"}
          </button>
          <button className="btn btn-secondary" onClick={onListEmployees}>
            {isKoLocale ? "직원 목록 조회" : "List employees"}
          </button>
        </div>
        {employees.length > 0 ? (
          <ul className="simple-list" aria-label={isKoLocale ? "직원 목록" : "Employee list"}>
            {employees.map((employee) => (
              <li key={employee.id}>
                <span>
                  <strong>{formatPublicEmployeeNumber(employee.id)}</strong>{" "}
                  <span className="muted">
                    {employee.active ? (isKoLocale ? "사용 중" : "Active") : isKoLocale ? "비활성" : "Inactive"}
                    {employee.name ? ` / ${formatEmployeeDisplayName(employee.name, locale)}` : ""}
                    {employee.email ? ` / ${employee.email}` : ""}
                  </span>
                </span>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onApplyEmployee(employee.id)}>
                  {isKoLocale ? "이 직원으로 적용" : "Apply this employee"}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <article className="panel" id="invites">
        <h2>{isKoLocale ? "초대 및 가입" : "Invite and sign-up"}</h2>
        <p className="small">
          {isKoLocale
            ? "직원에게 전달할 초대 링크를 생성합니다. 직원 번호를 함께 넣으면 가입 후 직원 포털과 바로 연결됩니다."
            : "Generate invite links for employees. Include the employee number to map the employee portal immediately after sign-up."}
        </p>
        <p className="small">
          {isKoLocale ? "초대가 연결될 워크스페이스" : "Invite workspace"}:{" "}
          <strong>{organizationId.trim() ? workspaceLabel : workspaceMissingLabel}</strong>
        </p>
        <div className="input-grid">
          <label className="full">
            {isKoLocale ? "초대 이메일" : "Invite email"}
            <input
              value={inviteEmail}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <label>
            {isKoLocale ? "역할" : "Role"}
            <select value={inviteRole} onChange={(event) => onInviteRoleChange(event.target.value as InviteRole)}>
              <option value="employee">{inviteRoleLabels.employee}</option>
              <option value="manager">{inviteRoleLabels.manager}</option>
              <option value="payroll_operator">{inviteRoleLabels.payroll_operator}</option>
              <option value="admin">{inviteRoleLabels.admin}</option>
            </select>
          </label>
          <label>
            {isKoLocale ? "전달 방식" : "Delivery mode"}
            <select value={inviteDeliveryMode} onChange={(event) => onInviteDeliveryModeChange(event.target.value as InviteDeliveryMode)}>
              <option value="link">{inviteDeliveryModeLabels.link}</option>
              <option value="email">{inviteDeliveryModeLabels.email}</option>
            </select>
          </label>
          <label>
            {isKoLocale ? "직원 번호 (선택)" : "Employee number (optional)"}
            <input
              value={inviteActorId}
              onChange={(event) => onInviteActorIdChange(event.target.value)}
              placeholder={isKoLocale ? "예: EMP-1001" : "e.g. EMP-1001"}
            />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateInvite} disabled={!inviteEmail.trim() || !organizationId.trim()}>
            {isKoLocale ? "초대 링크 생성" : "Create invite link"}
          </button>
        </div>
        {inviteResult ? (
          <>
            <p className="small">
              {isKoLocale ? "생성됨" : "Created"}: <strong>{inviteResult.email}</strong> ·{" "}
              {toInviteRoleLabel(inviteResult.role)} · {toInviteDeliveryModeLabel(inviteResult.deliveryMode)}
              {inviteResult.actorId ? ` · ${formatPublicEmployeeNumber(inviteResult.actorId)}` : ""}
            </p>
            {inviteResult.actionLink ? (
              <label className="full" style={{ display: "block", marginTop: 8 }}>
                {isKoLocale ? "초대 링크" : "Invite link"}
                <textarea readOnly rows={3} value={inviteResult.actionLink} />
              </label>
            ) : (
              <p className="small muted" style={{ marginTop: 8 }}>
                {isKoLocale
                  ? "이메일 발송 모드로 생성되어 링크를 별도로 저장하지 않았습니다."
                  : "Created in email delivery mode, so the action link was not stored separately."}
              </p>
            )}
            <p className="small muted" style={{ marginTop: 8 }}>
              {isKoLocale
                ? "로그인 페이지로 연결하려면 Supabase Auth Redirect URL에 현재 도메인이 허용되어 있어야 합니다."
                : "The current domain must be allowed in Supabase Auth Redirect URLs for the login redirect to work."}
            </p>
          </>
        ) : (
          <p className="small muted">{isKoLocale ? "아직 초대 링크를 생성하지 않았습니다." : "No invite link has been created yet."}</p>
        )}
      </article>
    </>
  );
}
