import type { LeaveRequestUnit } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

export const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const FULL_DAY_HOURS = 8;
export const DEFAULT_GRANTED_DAYS = 15;
export const DEFAULT_CARRY_OVER_CAP_DAYS = 5;
export const DEFAULT_ALLOW_HALF_DAY = true;
export const DEFAULT_ALLOW_HOURLY = true;
export const DEFAULT_HOURLY_INCREMENT_MINUTES = 30;
export const DEFAULT_MAX_HOURS_PER_REQUEST = 8;
export const DEFAULT_MIN_NOTICE_DAYS = 0;
export const DEFAULT_MAX_CONSECUTIVE_DAYS: number | null = null;
export const DEFAULT_ANNUAL_LEAVE_PROMOTION_ENABLED = false;
export const DEFAULT_ANNUAL_LEAVE_PROMOTION_THRESHOLD_DAYS = 5;
export const DEFAULT_ANNUAL_LEAVE_PROMOTION_LEAD_DAYS = 30;
export const DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE =
  "Annual leave notice: Please use your remaining annual leave before year end.";

export type LeavePolicyRules = {
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: number;
  minNoticeDays: number;
  maxConsecutiveDays: number | null;
  annualLeavePromotionEnabled: boolean;
  annualLeavePromotionThresholdDays: number;
  annualLeavePromotionLeadDays: number;
  annualLeavePromotionMessageTemplate: string;
};

export function toSeoulDayIndex(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  return Math.floor(
    Date.UTC(adjusted.getUTCFullYear(), adjusted.getUTCMonth(), adjusted.getUTCDate()) / DAY_MS
  );
}

export function fromSeoulDayIndex(dayIndex: number) {
  return new Date(dayIndex * DAY_MS - SEOUL_OFFSET_MS);
}

export function formatSeoulDay(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  const year = adjusted.getUTCFullYear();
  const month = String(adjusted.getUTCMonth() + 1).padStart(2, "0");
  const day = String(adjusted.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getSeoulDayOfWeek(dayIndex: number) {
  const adjusted = new Date(dayIndex * DAY_MS + SEOUL_OFFSET_MS);
  return adjusted.getUTCDay();
}

export function isWeekendSeoulDayIndex(dayIndex: number) {
  const dayOfWeek = getSeoulDayOfWeek(dayIndex);
  return dayOfWeek === 0 || dayOfWeek === 6;
}

export function resolveSeoulYearEnd(value: Date) {
  const adjusted = new Date(value.getTime() + SEOUL_OFFSET_MS);
  const year = adjusted.getUTCFullYear();
  return new Date(Date.UTC(year, 11, 31, 14, 59, 59, 999));
}

export function calculateLeaveDays(startDate: Date, endDate: Date) {
  if (endDate < startDate) {
    throw new ServiceError(400, "endDate must be same or after startDate");
  }
  const startDay = toSeoulDayIndex(startDate);
  const endDay = toSeoulDayIndex(endDate);
  const days = endDay - startDay + 1;
  if (days <= 0) {
    throw new ServiceError(400, "leave days must be positive");
  }
  return days;
}

export function calculateBusinessLeaveDays(input: {
  startDate: Date;
  endDate: Date;
  holidayDayIndexes?: ReadonlySet<number>;
}) {
  if (input.endDate < input.startDate) {
    throw new ServiceError(400, "endDate must be same or after startDate");
  }

  const startDay = toSeoulDayIndex(input.startDate);
  const endDay = toSeoulDayIndex(input.endDate);
  let days = 0;

  for (let dayIndex = startDay; dayIndex <= endDay; dayIndex += 1) {
    if (isWeekendSeoulDayIndex(dayIndex)) {
      continue;
    }
    if (input.holidayDayIndexes?.has(dayIndex)) {
      continue;
    }
    days += 1;
  }

  if (days <= 0) {
    throw new ServiceError(400, "leave days must be positive");
  }

  return days;
}

export function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

export function calculateProRatedAnnualGrantDays(input: {
  joinDate: Date;
  year: number;
  annualGrantDays: number;
}) {
  const adjustedJoin = new Date(input.joinDate.getTime() + SEOUL_OFFSET_MS);
  const joinYear = adjustedJoin.getUTCFullYear();

  if (joinYear > input.year) {
    return 0;
  }
  if (joinYear < input.year) {
    return input.annualGrantDays;
  }

  const joinMonthIndex = adjustedJoin.getUTCMonth();
  const activeMonths = 12 - joinMonthIndex;
  if (activeMonths <= 0) {
    return 0;
  }

  const prorated = Math.floor((input.annualGrantDays * activeMonths) / 12);
  return Math.max(1, prorated);
}

export function calculateHoursBetween(startDate: Date, endDate: Date) {
  if (endDate <= startDate) {
    throw new ServiceError(400, "endDate must be after startDate");
  }
  return roundTo2((endDate.getTime() - startDate.getTime()) / (60 * 60 * 1000));
}

export function isSameSeoulDay(left: Date, right: Date) {
  return toSeoulDayIndex(left) === toSeoulDayIndex(right);
}

export function resolvePolicyRules(policy?: {
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay?: boolean;
  allowHourly?: boolean;
  hourlyIncrementMinutes?: number;
  maxHoursPerRequest?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number | null;
  annualLeavePromotionEnabled?: boolean;
  annualLeavePromotionThresholdDays?: number;
  annualLeavePromotionLeadDays?: number;
  annualLeavePromotionMessageTemplate?: string | null;
} | null): LeavePolicyRules {
  return {
    annualGrantDays: policy?.annualGrantDays ?? DEFAULT_GRANTED_DAYS,
    carryOverCapDays: policy?.carryOverCapDays ?? DEFAULT_CARRY_OVER_CAP_DAYS,
    allowHalfDay: policy?.allowHalfDay ?? DEFAULT_ALLOW_HALF_DAY,
    allowHourly: policy?.allowHourly ?? DEFAULT_ALLOW_HOURLY,
    hourlyIncrementMinutes: policy?.hourlyIncrementMinutes ?? DEFAULT_HOURLY_INCREMENT_MINUTES,
    maxHoursPerRequest: policy?.maxHoursPerRequest ?? DEFAULT_MAX_HOURS_PER_REQUEST,
    minNoticeDays: policy?.minNoticeDays ?? DEFAULT_MIN_NOTICE_DAYS,
    maxConsecutiveDays: policy?.maxConsecutiveDays ?? DEFAULT_MAX_CONSECUTIVE_DAYS,
    annualLeavePromotionEnabled:
      policy?.annualLeavePromotionEnabled ?? DEFAULT_ANNUAL_LEAVE_PROMOTION_ENABLED,
    annualLeavePromotionThresholdDays:
      policy?.annualLeavePromotionThresholdDays ?? DEFAULT_ANNUAL_LEAVE_PROMOTION_THRESHOLD_DAYS,
    annualLeavePromotionLeadDays:
      policy?.annualLeavePromotionLeadDays ?? DEFAULT_ANNUAL_LEAVE_PROMOTION_LEAD_DAYS,
    annualLeavePromotionMessageTemplate:
      policy?.annualLeavePromotionMessageTemplate?.trim() ||
      DEFAULT_ANNUAL_LEAVE_PROMOTION_MESSAGE_TEMPLATE
  };
}

export function renderPromotionMessageTemplate(
  template: string,
  values: Record<string, string | number>
): string {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function calculateRequestedLeave(input: {
  unit: LeaveRequestUnit;
  startDate: Date;
  endDate: Date;
  hours?: number | null;
  policy: LeavePolicyRules;
}): { unit: LeaveRequestUnit; days: number; hours: number | null } {
  const unit = input.unit;

  if (unit === "FULL_DAY") {
    const days = calculateLeaveDays(input.startDate, input.endDate);
    return {
      unit,
      days: roundTo2(days),
      hours: roundTo2(days * FULL_DAY_HOURS)
    };
  }

  if (unit === "HALF_DAY") {
    if (!input.policy.allowHalfDay) {
      throw new ServiceError(409, "leave policy does not allow half-day requests");
    }
    if (!isSameSeoulDay(input.startDate, input.endDate)) {
      throw new ServiceError(400, "half-day leave must be within the same day");
    }
    return {
      unit,
      days: 0.5,
      hours: FULL_DAY_HOURS / 2
    };
  }

  if (!input.policy.allowHourly) {
    throw new ServiceError(409, "leave policy does not allow hourly requests");
  }
  if (!isSameSeoulDay(input.startDate, input.endDate)) {
    throw new ServiceError(400, "hourly leave must be within the same day");
  }
  const hoursFromRange = calculateHoursBetween(input.startDate, input.endDate);
  const requestedHours = input.hours ?? hoursFromRange;
  if (!Number.isFinite(requestedHours) || requestedHours <= 0) {
    throw new ServiceError(400, "hourly leave hours must be positive");
  }
  if (requestedHours > input.policy.maxHoursPerRequest) {
    throw new ServiceError(400, "hourly leave exceeds maxHoursPerRequest policy");
  }
  const minutes = Math.round(requestedHours * 60);
  if (minutes % input.policy.hourlyIncrementMinutes !== 0) {
    throw new ServiceError(400, "hourly leave must align with policy increment");
  }
  return {
    unit,
    days: roundTo2(requestedHours / FULL_DAY_HOURS),
    hours: roundTo2(requestedHours)
  };
}

export function assertPolicyRequestConstraints(input: {
  startDate: Date;
  requestedDays: number;
  policy: LeavePolicyRules;
  now?: Date;
}) {
  const maxConsecutiveDays = input.policy.maxConsecutiveDays;
  if (
    maxConsecutiveDays !== null &&
    Number.isFinite(maxConsecutiveDays) &&
    input.requestedDays > maxConsecutiveDays
  ) {
    throw new ServiceError(
      409,
      `leave policy maxConsecutiveDays exceeded (${maxConsecutiveDays} days)`
    );
  }

  const now = input.now ?? new Date();
  const noticeDays = toSeoulDayIndex(input.startDate) - toSeoulDayIndex(now);
  if (input.policy.minNoticeDays > 0 && noticeDays < input.policy.minNoticeDays) {
    throw new ServiceError(
      409,
      `leave policy requires at least ${input.policy.minNoticeDays} day(s) notice`
    );
  }
}

export function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}
