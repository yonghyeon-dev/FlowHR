import type {
  DataAccess,
  EmployeeEntity,
  OrganizationEntity,
  WorkScheduleEntity
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import { listStrictScheduleOverlaps } from "@/features/scheduling/schedule-overlap-helpers";
import {
  dateTimeFromKstDateAndMinute,
  enumerateDateRange,
  formatKstDateYmd,
  parseDateToKstBase,
  weekdayFromKstDate
} from "@/features/scheduling/template-date-helpers";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_START_MINUTE = 9 * 60;
const DEFAULT_BREAK_MINUTES = 60;
const DEFAULT_WORK_DAYS_PER_WEEK = 5;
const DEFAULT_DAILY_WORK_HOURS = 8;

type SeedRangeInput = {
  fromDate: string;
  toDate: string;
};

export type DefaultWorkScheduleSeedResult = {
  employeeId: string;
  organizationId: string;
  fromDate: string;
  toDate: string;
  candidateCount: number;
  createdCount: number;
  skippedOverlapCount: number;
  createdScheduleIds: string[];
};

function toKstMonthEndDate(baseDateYmd: string) {
  const base = parseDateToKstBase(baseDateYmd);
  const shifted = new Date(base.getTime() + KST_OFFSET_MS);
  const year = shifted.getUTCFullYear();
  const month = shifted.getUTCMonth();
  const lastDate = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDate).padStart(2, "0")}`;
}

function normalizeSeedRange(input?: Partial<SeedRangeInput>, baseDate?: Date): SeedRangeInput {
  const fallbackFromDate = formatKstDateYmd(baseDate ?? new Date());
  const fromDate = (input?.fromDate ?? fallbackFromDate).trim();
  const toDate = (input?.toDate ?? toKstMonthEndDate(fromDate)).trim();
  parseDateToKstBase(fromDate);
  parseDateToKstBase(toDate);
  if (parseDateToKstBase(toDate).getTime() < parseDateToKstBase(fromDate).getTime()) {
    throw new ServiceError(400, "toDate must be on or after fromDate");
  }
  return { fromDate, toDate };
}

function resolveDefaultWeekdays(organization: Pick<OrganizationEntity, "standardWorkDaysPerWeek">) {
  const configured = Number.isInteger(organization.standardWorkDaysPerWeek)
    ? organization.standardWorkDaysPerWeek
    : DEFAULT_WORK_DAYS_PER_WEEK;
  const normalized = Math.max(1, Math.min(7, configured));
  return Array.from({ length: normalized }, (_, index) => index + 1);
}

function resolveDailyWorkMinutes(
  organization: Pick<OrganizationEntity, "standardWorkHoursPerDay" | "workHoursPerDay">
) {
  const configured =
    Number.isFinite(organization.standardWorkHoursPerDay) && organization.standardWorkHoursPerDay > 0
      ? organization.standardWorkHoursPerDay
      : Number.isFinite(organization.workHoursPerDay) && organization.workHoursPerDay > 0
        ? organization.workHoursPerDay
        : DEFAULT_DAILY_WORK_HOURS;
  return Math.max(1, Math.round(configured * 60));
}

function buildRangePeriod(range: SeedRangeInput) {
  const periodStart = dateTimeFromKstDateAndMinute(range.fromDate, 0);
  const periodEnd = new Date(dateTimeFromKstDateAndMinute(range.toDate, 0).getTime() + ONE_DAY_MS);
  return { periodStart, periodEnd };
}

export function resolveDefaultWorkScheduleSeedRange(baseDate?: Date): SeedRangeInput {
  return normalizeSeedRange(undefined, baseDate);
}

export async function seedDefaultWorkSchedulesForEmployee(input: {
  dataAccess: DataAccess;
  employee: EmployeeEntity;
  range?: Partial<SeedRangeInput>;
  baseDate?: Date;
}): Promise<DefaultWorkScheduleSeedResult> {
  const organizationId = input.employee.organizationId;
  if (!organizationId) {
    throw new ServiceError(400, "employee organization is required for default schedule seed");
  }

  const organization = await input.dataAccess.organizations.findById(organizationId);
  if (!organization) {
    throw new ServiceError(404, "organization not found");
  }

  const range = normalizeSeedRange(input.range, input.baseDate);
  const weekdays = resolveDefaultWeekdays(organization);
  const dailyWorkMinutes = resolveDailyWorkMinutes(organization);
  const durationMinutes = dailyWorkMinutes + DEFAULT_BREAK_MINUTES;
  const dateRange = enumerateDateRange(range.fromDate, range.toDate);
  const targetDates = dateRange.filter((dateYmd) => weekdays.includes(weekdayFromKstDate(dateYmd)));

  const { periodStart, periodEnd } = buildRangePeriod(range);
  const existingSchedules = await input.dataAccess.scheduling.listInPeriod({
    periodStart,
    periodEnd,
    organizationId,
    employeeId: input.employee.id
  });

  const createdScheduleIds: string[] = [];
  let skippedOverlapCount = 0;
  const mutableSchedules: WorkScheduleEntity[] = [...existingSchedules];

  for (const dateYmd of targetDates) {
    const startAt = dateTimeFromKstDateAndMinute(dateYmd, DEFAULT_START_MINUTE);
    const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);
    const overlaps = listStrictScheduleOverlaps({
      schedules: mutableSchedules,
      startAt,
      endAt
    });
    if (overlaps.length > 0) {
      skippedOverlapCount += 1;
      continue;
    }

    const created = await input.dataAccess.scheduling.create({
      employeeId: input.employee.id,
      startAt,
      endAt,
      breakMinutes: DEFAULT_BREAK_MINUTES,
      isHoliday: false
    });
    mutableSchedules.push(created);
    createdScheduleIds.push(created.id);
  }

  return {
    employeeId: input.employee.id,
    organizationId,
    fromDate: range.fromDate,
    toDate: range.toDate,
    candidateCount: targetDates.length,
    createdCount: createdScheduleIds.length,
    skippedOverlapCount,
    createdScheduleIds
  };
}
