import type { DataAccess } from "@/features/shared/data-access";

type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";

type ResolvedApproverInfo = {
  expectedRole: string;
  domain: ApprovalDomain;
};

/**
 * Resolves the expected approver role for a given approval domain.
 *
 * The FlowHR approval system maps domains to roles (e.g., LEAVE → "manager"),
 * not to specific employee IDs. This helper reads the org's approval policy
 * and returns the role name expected to approve the given domain.
 *
 * Future: once a role→employee mapping exists, this can return actual employee IDs.
 */
export async function resolveApproverRole(
  dataAccess: DataAccess,
  organizationId: string,
  domain: ApprovalDomain
): Promise<ResolvedApproverInfo> {
  const policy = await dataAccess.approvals.findPolicyByOrganizationId(organizationId);

  let expectedRole: string;
  if (policy) {
    switch (domain) {
      case "ATTENDANCE":
        expectedRole = policy.attendanceApproverRole;
        break;
      case "LEAVE":
        expectedRole = policy.leaveApproverRole;
        break;
      case "PAYROLL":
        expectedRole = policy.payrollApproverRole;
        break;
      default:
        expectedRole = "manager";
    }
  } else {
    expectedRole = domain === "PAYROLL" ? "payroll_operator" : "manager";
  }

  return { expectedRole, domain };
}
