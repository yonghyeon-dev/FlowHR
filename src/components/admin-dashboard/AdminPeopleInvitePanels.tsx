import type {
  EmployeeSummary,
  InviteDeliveryMode,
  InviteResultDto,
  InviteRole
} from "@/app/admin/page-types";

type InviteRoleLabels = Record<InviteRole, string>;
type InviteDeliveryModeLabels = Record<InviteDeliveryMode, string>;

type AdminPeopleInvitePanelsProps = {
  isKoLocale: boolean;
  organizationId: string;
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
  onOrganizationIdChange: (value: string) => void;
  onCreateInvite: () => void;
};

export function AdminPeopleInvitePanels({
  isKoLocale,
  organizationId,
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
  onOrganizationIdChange,
  onCreateInvite
}: AdminPeopleInvitePanelsProps) {
  return (
    <>
      <article className="panel" id="people">
        <h2>직원 관리</h2>
        <p className="small">출퇴근/휴가/급여는 Employee 마스터가 있어야 동작합니다. 먼저 직원부터 생성하세요.</p>
        <div className="input-grid">
          <label>
            직원 ID
            <input value={employeeId} onChange={(event) => onEmployeeIdChange(event.target.value)} />
          </label>
          <label>
            이름 (선택)
            <input value={employeeName} onChange={(event) => onEmployeeNameChange(event.target.value)} />
          </label>
          <label>
            이메일 (선택)
            <input value={employeeEmail} onChange={(event) => onEmployeeEmailChange(event.target.value)} />
          </label>
          <label>
            활성
            <select value={employeeActive ? "yes" : "no"} onChange={(event) => onEmployeeActiveChange(event.target.value === "yes")}>
              <option value="yes">예</option>
              <option value="no">아니오</option>
            </select>
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateEmployee} disabled={!employeeId.trim() || !organizationId.trim()}>
            직원 생성
          </button>
          <button className="btn btn-secondary" onClick={onListEmployees}>
            직원 목록 조회
          </button>
        </div>
        {employees.length > 0 ? (
          <ul className="simple-list" aria-label="직원 목록">
            {employees.map((employee) => (
              <li key={employee.id}>
                <span>
                  <strong>{employee.id}</strong>{" "}
                  <span className="muted">
                    {employee.active ? "활성" : "비활성"} / {employee.organizationId ?? "-"}
                    {employee.name ? ` / ${employee.name}` : ""}
                    {employee.email ? ` / ${employee.email}` : ""}
                  </span>
                </span>
                <button type="button" className="btn btn-secondary btn-small" onClick={() => onApplyEmployee(employee.id)}>
                  이 직원으로 적용
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      <article className="panel" id="invites">
        <h2>초대/가입</h2>
        <p className="small">
          {isKoLocale
            ? "직원에게 전달할 초대 링크를 생성합니다. 액터 ID에 직원 ID(Employee.id)를 넣으면 직원 포털이 해당 직원으로 매핑됩니다."
            : "Generate invite links for employees. If actor ID contains Employee.id, employee portal maps to that employee."}
        </p>
        <div className="input-grid">
          <label className="full">
            초대 이메일
            <input
              value={inviteEmail}
              onChange={(event) => onInviteEmailChange(event.target.value)}
              placeholder="you@company.com"
            />
          </label>
          <label>
            역할
            <select value={inviteRole} onChange={(event) => onInviteRoleChange(event.target.value as InviteRole)}>
              <option value="employee">{inviteRoleLabels.employee}</option>
              <option value="manager">{inviteRoleLabels.manager}</option>
              <option value="payroll_operator">{inviteRoleLabels.payroll_operator}</option>
              <option value="admin">{inviteRoleLabels.admin}</option>
            </select>
          </label>
          <label>
            전달 방식
            <select value={inviteDeliveryMode} onChange={(event) => onInviteDeliveryModeChange(event.target.value as InviteDeliveryMode)}>
              <option value="link">{inviteDeliveryModeLabels.link}</option>
              <option value="email">{inviteDeliveryModeLabels.email}</option>
            </select>
          </label>
          <label>
            {isKoLocale ? "액터 ID (선택)" : "Actor ID (optional)"}
            <input
              value={inviteActorId}
              onChange={(event) => onInviteActorIdChange(event.target.value)}
              placeholder="예: EMP-1001"
            />
          </label>
          <label className="full">
            {isKoLocale ? "조직 ID" : "Organization ID"}
            <input value={organizationId} onChange={(event) => onOrganizationIdChange(event.target.value)} />
          </label>
        </div>
        <div className="actions">
          <button className="btn btn-primary" onClick={onCreateInvite} disabled={!inviteEmail.trim() || !organizationId.trim()}>
            초대 링크 생성
          </button>
        </div>
        {inviteResult ? (
          <>
            <p className="small">
              생성됨: <strong>{inviteResult.email}</strong> · role={toInviteRoleLabel(inviteResult.role)} · delivery=
              {toInviteDeliveryModeLabel(inviteResult.deliveryMode)} · org={inviteResult.organizationId}
              {inviteResult.actorId ? ` · actor=${inviteResult.actorId}` : ""}
            </p>
            {inviteResult.actionLink ? (
              <label className="full" style={{ display: "block", marginTop: 8 }}>
                초대 링크 (action_link)
                <textarea readOnly rows={3} value={inviteResult.actionLink} />
              </label>
            ) : (
              <p className="small muted" style={{ marginTop: 8 }}>
                이메일 발송 모드로 생성되어 action_link를 저장하지 않았습니다.
              </p>
            )}
            <p className="small muted" style={{ marginTop: 8 }}>
              링크가 `/login`으로 리다이렉트되려면 Supabase Auth의 Redirect URL에 현재 도메인이 허용되어 있어야 합니다.
            </p>
          </>
        ) : (
          <p className="small muted">아직 초대 링크를 생성하지 않았습니다.</p>
        )}
      </article>
    </>
  );
}
