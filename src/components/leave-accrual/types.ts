export type AutoGrantResultItem = {
  employeeId: string;
  name: string | null;
  email: string | null;
  joinedAt: string;
  lastAccrualYear: number | null;
  currentRemainingDays: number;
  suggestedAnnualGrantDays: number;
  carryOverAppliedDays: number;
  projectedGrantedDays: number;
  projectedRemainingDays: number;
  status: "ELIGIBLE" | "ALREADY_SETTLED" | "NOT_ELIGIBLE" | "APPLIED" | "FAILED";
  reason: string | null;
  balance: {
    grantedDays: number;
    usedDays: number;
    remainingDays: number;
    carryOverDays: number;
    lastAccrualYear: number | null;
    updatedAt: string;
  } | null;
};

export type AutoGrantResponse = {
  organizationId: string;
  year: number;
  dryRun: boolean;
  policy: {
    annualGrantDays: number;
    carryOverCapDays: number;
    source: "configured" | "default";
  };
  summary: {
    activeEmployeeCount: number;
    eligibleCount: number;
    alreadySettledCount: number;
    notEligibleCount: number;
    appliedCount: number;
    failedCount: number;
    totalSuggestedGrantDays: number;
    totalProjectedCarryOverDays: number;
  };
  results: AutoGrantResultItem[];
};

export type ApiLog = {
  id: number;
  label: string;
  ok: boolean;
  status: number;
  at: string;
};

export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

export function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}
