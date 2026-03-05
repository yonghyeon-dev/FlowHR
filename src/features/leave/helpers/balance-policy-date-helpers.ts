import {
  SEOUL_OFFSET_MS,
  roundTo2
} from "@/features/leave/policy-time-helpers";
import type {
  LeaveRequestEntity,
  LeaveType
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

export type AvailableLeaveBalanceSummary = {
  total: number;
  used: number;
  pending: number;
  available: number;
};

type LeavePolicyValidationInput = {
  annualGrantDays: number;
  carryOverCapDays: number;
  hourlyIncrementMinutes?: number;
  maxHoursPerRequest?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number | null;
  annualLeavePromotionThresholdDays?: number;
  annualLeavePromotionLeadDays?: number;
  annualLeavePromotionMessageTemplate?: string | null;
};

export function assertValidLeaveBalanceYear(year: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999) {
    throw new ServiceError(400, "year must be a valid 4-digit year");
  }
}

export function resolveSeoulYearRange(year: number) {
  return {
    periodStart: new Date(`${year}-01-01T00:00:00+09:00`),
    periodEnd: new Date(`${year}-12-31T23:59:59.999+09:00`)
  };
}

export function resolveSeoulYearFromDate(date: Date) {
  return new Date(date.getTime() + SEOUL_OFFSET_MS).getUTCFullYear();
}

export function buildAvailableLeaveBalanceSummary(
  requests: LeaveRequestEntity[],
  leaveType: LeaveType,
  grantedDays: number
): AvailableLeaveBalanceSummary {
  let used = 0;
  let pending = 0;

  for (const request of requests) {
    if (request.leaveType !== leaveType) {
      continue;
    }
    if (request.state === "APPROVED") {
      used += request.days;
      continue;
    }
    if (request.state === "PENDING") {
      pending += request.days;
    }
  }

  const total = roundTo2(grantedDays);
  const roundedUsed = roundTo2(used);
  const roundedPending = roundTo2(pending);
  const available = roundTo2(total - roundedUsed - roundedPending);

  return {
    total,
    used: roundedUsed,
    pending: roundedPending,
    available
  };
}

export function assertValidUpsertLeavePolicyInput(input: LeavePolicyValidationInput) {
  if (!Number.isInteger(input.annualGrantDays) || input.annualGrantDays <= 0) {
    throw new ServiceError(400, "annualGrantDays must be a positive integer");
  }
  if (!Number.isInteger(input.carryOverCapDays) || input.carryOverCapDays < 0) {
    throw new ServiceError(400, "carryOverCapDays must be a non-negative integer");
  }
  if (input.hourlyIncrementMinutes !== undefined) {
    if (!Number.isInteger(input.hourlyIncrementMinutes) || input.hourlyIncrementMinutes < 15) {
      throw new ServiceError(400, "hourlyIncrementMinutes must be an integer >= 15");
    }
  }
  if (input.maxHoursPerRequest !== undefined) {
    if (!Number.isFinite(input.maxHoursPerRequest) || input.maxHoursPerRequest <= 0) {
      throw new ServiceError(400, "maxHoursPerRequest must be a positive number");
    }
  }
  if (input.minNoticeDays !== undefined) {
    if (!Number.isInteger(input.minNoticeDays) || input.minNoticeDays < 0) {
      throw new ServiceError(400, "minNoticeDays must be a non-negative integer");
    }
  }
  if (input.maxConsecutiveDays !== undefined && input.maxConsecutiveDays !== null) {
    if (!Number.isFinite(input.maxConsecutiveDays) || input.maxConsecutiveDays <= 0) {
      throw new ServiceError(400, "maxConsecutiveDays must be a positive number or null");
    }
  }
  if (input.annualLeavePromotionThresholdDays !== undefined) {
    if (
      !Number.isFinite(input.annualLeavePromotionThresholdDays) ||
      input.annualLeavePromotionThresholdDays <= 0
    ) {
      throw new ServiceError(400, "annualLeavePromotionThresholdDays must be a positive number");
    }
  }
  if (input.annualLeavePromotionLeadDays !== undefined) {
    if (
      !Number.isInteger(input.annualLeavePromotionLeadDays) ||
      input.annualLeavePromotionLeadDays < 0
    ) {
      throw new ServiceError(400, "annualLeavePromotionLeadDays must be a non-negative integer");
    }
  }
  if (input.annualLeavePromotionMessageTemplate !== undefined && input.annualLeavePromotionMessageTemplate !== null) {
    if (input.annualLeavePromotionMessageTemplate.trim().length === 0) {
      throw new ServiceError(400, "annualLeavePromotionMessageTemplate cannot be blank");
    }
  }
}
