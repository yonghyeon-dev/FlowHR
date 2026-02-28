import type {
  CreateWorkScheduleInput,
  CreateWorkScheduleTemplateInput,
  UpdateWorkScheduleInput
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

type CreateScheduleInput = {
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

type UpdateScheduleInput = {
  startAt?: Date;
  endAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string;
};

type CreateTemplateInput = {
  name: string;
  startMinute: number;
  endMinute: number;
  breakMinutes: number;
  isHoliday: boolean;
  weekdays: number[];
  notes?: string;
};

export function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "to must be after from");
  }
}

export function normalizeLateThresholdMinutes(value: number | undefined) {
  const normalized = value ?? 10;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 240) {
    throw new ServiceError(400, "lateThresholdMinutes must be an integer in range 0..240");
  }
  return normalized;
}

export function normalizeTopN(value: number | undefined) {
  const normalized = value ?? 20;
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > 200) {
    throw new ServiceError(400, "topN must be an integer in range 1..200");
  }
  return normalized;
}

export function normalizeScheduleAnomalyReportWindowInput(input: {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number | undefined;
}) {
  ensureValidPeriod(input.periodStart, input.periodEnd);
  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes: normalizeLateThresholdMinutes(input.lateThresholdMinutes)
  };
}

export function normalizeScheduleAnomalyCockpitWindowInput(input: {
  periodStart: Date;
  periodEnd: Date;
  lateThresholdMinutes: number | undefined;
  topN: number | undefined;
}) {
  ensureValidPeriod(input.periodStart, input.periodEnd);
  return {
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    lateThresholdMinutes: normalizeLateThresholdMinutes(input.lateThresholdMinutes),
    topN: normalizeTopN(input.topN)
  };
}

export function toCreateInput(input: CreateScheduleInput): CreateWorkScheduleInput {
  return {
    employeeId: input.employeeId,
    startAt: input.startAt,
    endAt: input.endAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  };
}

export function toUpdateInput(input: UpdateScheduleInput): UpdateWorkScheduleInput {
  return {
    startAt: input.startAt,
    endAt: input.endAt,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    notes: input.notes
  };
}

export function toTemplateCreateInput(
  input: CreateTemplateInput,
  organizationId: string
): CreateWorkScheduleTemplateInput {
  return {
    organizationId,
    name: input.name,
    startMinute: input.startMinute,
    endMinute: input.endMinute,
    breakMinutes: input.breakMinutes,
    isHoliday: input.isHoliday,
    weekdays: [...input.weekdays],
    notes: input.notes
  };
}

export function ensureValidTemplateMinutes(startMinute: number, endMinute: number) {
  if (startMinute < 0 || startMinute >= 1440 || endMinute < 0 || endMinute >= 1440) {
    throw new ServiceError(400, "template minute fields must be in range 0..1439");
  }
  if (startMinute === endMinute) {
    throw new ServiceError(400, "startMinute and endMinute cannot be equal");
  }
}

export function normalizeWeekdays(weekdays: number[]) {
  const unique = Array.from(new Set(weekdays)).sort((a, b) => a - b);
  if (unique.length === 0) {
    throw new ServiceError(400, "weekdays must include at least one day");
  }
  if (unique.some((day) => day < 1 || day > 7)) {
    throw new ServiceError(400, "weekdays must be in range 1..7");
  }
  return unique;
}
