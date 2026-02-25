export type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";

export type ApprovalPolicyDto = {
  id: string;
  organizationId: string;
  attendanceApproverRole: string;
  leaveApproverRole: string;
  payrollApproverRole: string;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalDelegationDto = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  delegatorRole: string;
  delegateActorId: string;
  reason: string | null;
  startsAt: string;
  endsAt: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApprovalDelegationExpireResultDto = {
  organizationId: string;
  checkedCount: number;
  expiredCount: number;
  delegationIds: string[];
  effectiveAt: string;
  dryRun: boolean;
};

export type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

export const domainOptions: ApprovalDomain[] = ["ATTENDANCE", "LEAVE", "PAYROLL"];

export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function toIso(value: string) {
  return new Date(value).toISOString();
}
