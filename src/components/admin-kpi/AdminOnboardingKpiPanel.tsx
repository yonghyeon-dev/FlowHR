import { type KpiCopy } from "@/components/admin-kpi/copy";

type EmployeeLite = {
  id: string;
  email: string | null;
};

type AuthInviteLite = {
  email: string;
};

type ContractDocumentLite = {
  employeeId: string;
  status: "DRAFT" | "APPROVAL_REQUESTED" | "SENT" | "SIGNED" | "REJECTED" | "EXPIRED" | "RENEWED";
};

export type OnboardingKpiSnapshot = {
  activeEmployeeCount: number;
  inviteCoveragePercent: number;
  pendingInviteCount: number;
  contractResponseCoveragePercent: number;
  pendingContractResponseCount: number;
  readinessPercent: number;
};

function normalizeEmail(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

function resolvePercent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (part / total) * 100;
}

export function buildOnboardingKpiSnapshot(input: {
  employees: EmployeeLite[];
  invites: AuthInviteLite[];
  contractDocuments: ContractDocumentLite[];
}): OnboardingKpiSnapshot {
  const activeEmployeeCount = input.employees.length;
  const inviteEligibleEmployees = input.employees.filter(
    (employee) => normalizeEmail(employee.email).length > 0
  );
  const inviteEmailSet = new Set(
    input.invites
      .map((invite) => normalizeEmail(invite.email))
      .filter((email) => email.length > 0)
  );

  const coveredInviteEmployeeCount = inviteEligibleEmployees.filter((employee) =>
    inviteEmailSet.has(normalizeEmail(employee.email))
  ).length;
  const pendingInviteCount = Math.max(
    0,
    inviteEligibleEmployees.length - coveredInviteEmployeeCount
  );
  const inviteCoveragePercent = resolvePercent(
    coveredInviteEmployeeCount,
    inviteEligibleEmployees.length
  );

  const sentEmployeeSet = new Set(
    input.contractDocuments
      .filter((document) => ["SENT", "SIGNED", "RENEWED"].includes(document.status))
      .map((document) => document.employeeId)
  );
  const respondedEmployeeSet = new Set(
    input.contractDocuments
      .filter((document) => ["SIGNED", "REJECTED", "RENEWED"].includes(document.status))
      .map((document) => document.employeeId)
  );

  const pendingContractResponseCount = Math.max(
    0,
    sentEmployeeSet.size - respondedEmployeeSet.size
  );
  const contractResponseCoveragePercent = resolvePercent(
    respondedEmployeeSet.size,
    sentEmployeeSet.size
  );

  let readinessChecklistTotal = 0;
  let readinessChecklistDone = 0;
  const readinessChecks = [
    activeEmployeeCount > 0,
    inviteEligibleEmployees.length > 0 && pendingInviteCount === 0,
    sentEmployeeSet.size > 0 && pendingContractResponseCount === 0
  ];
  for (const check of readinessChecks) {
    readinessChecklistTotal += 1;
    if (check) {
      readinessChecklistDone += 1;
    }
  }
  const readinessPercent = resolvePercent(
    readinessChecklistDone,
    readinessChecklistTotal
  );

  return {
    activeEmployeeCount,
    inviteCoveragePercent,
    pendingInviteCount,
    contractResponseCoveragePercent,
    pendingContractResponseCount,
    readinessPercent
  };
}

type AdminOnboardingKpiPanelProps = {
  copy: KpiCopy;
  snapshot: OnboardingKpiSnapshot;
};

export function AdminOnboardingKpiPanel({
  copy,
  snapshot
}: AdminOnboardingKpiPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.onboardingPanel.title}</h2>
      <p className="small muted">{copy.onboardingPanel.description}</p>
      <div className="kpi-strip">
        <article className="kpi-card">
          <p>{copy.onboardingPanel.activeEmployeeCount}</p>
          <strong>{snapshot.activeEmployeeCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.onboardingPanel.inviteCoveragePercent}</p>
          <strong>{formatPercent(snapshot.inviteCoveragePercent)}</strong>
          <small>
            {copy.onboardingPanel.pendingInviteCount}:{" "}
            {snapshot.pendingInviteCount}
          </small>
        </article>
        <article className="kpi-card">
          <p>{copy.onboardingPanel.contractResponseCoveragePercent}</p>
          <strong>{formatPercent(snapshot.contractResponseCoveragePercent)}</strong>
          <small>
            {copy.onboardingPanel.pendingContractResponseCount}:{" "}
            {snapshot.pendingContractResponseCount}
          </small>
        </article>
        <article className="kpi-card">
          <p>{copy.onboardingPanel.readinessPercent}</p>
          <strong>{formatPercent(snapshot.readinessPercent)}</strong>
          <small>{copy.onboardingPanel.readinessHint}</small>
        </article>
      </div>
    </article>
  );
}
