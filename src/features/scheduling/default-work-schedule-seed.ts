import type { DataAccess, EmployeeEntity, OrganizationEntity } from "@/features/shared/data-access";
import {
  dateTimeFromKstDateAndMinute,
  enumerateDateRange,
  formatKstDateYmd,
  weekdayFromKstDate
} from "@/features/scheduling/template-date-helpers";

const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5] as const;
const DEFAULT_START_MINUTE = 9 * 60;
const DEFAULT_BREAK_MINUTES = 60;
const DEFAULT_DAILY_WORK_HOURS = 8;
const DEFAULT_SEED_NOTES = "Default work schedule seed";

const LOOKUP_RANGE_START_ISO = "2000-01-01T00:00:00+09:00";
const LOOKUP_RANGE_END_ISO = "2100-12-31T23:59:59+09:00";

type SeedScheduleWindow = {
  fromDate: string;
  toDate: string;
};

export type SeedDefaultWorkSchedulesForEmployeeResult = {
  employeeId: string;
  organizationId: string | null;
  window: SeedScheduleWindow | null;
  candidateDays: number;
  createdSchedules: number;
  createdScheduleIds: string[];
  skippedReason:
    | null
    | "employee_not_active"
    | "employee_has_no_organization"
    | "organization_not_found"
    | "no_workdays_in_window";
};

export type SeedDefaultWorkSchedulesForOrganizationResult = {
  organizationId: string;
  checkedAt: string;
  onlyIfNoSchedules: boolean;
  hasAnySchedulesBeforeSeed: boolean;
  totalActiveEmployees: number;
  createdEmployees: number;
  skippedEmployees: number;
  createdSchedules: number;
  employeeResults: SeedDefaultWorkSchedulesForEmployeeResult[];
};

function parseTimeToMinute(time: string | null) {
  if (!time) {
    return null;
  }
  const normalized = time.trim();
  const matched = normalized.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!matched) {
    return null;
  }
  const hour = Number.parseInt(matched[1]!, 10);
  const minute = Number.parseInt(matched[2]!, 10);
  return hour * 60 + minute;
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function normalizeWeekdaysFromOrganization(organization: OrganizationEntity) {
  const workDays = Array.from(
    new Set(
      (organization.workDays ?? [])
        .map((value) => Number.parseInt(String(value), 10))
        .filter((value) => Number.isInteger(value) && value >= 1 && value <= 7)
    )
  ).sort((left, right) => left - right);

  if (workDays.length > 0) {
    return workDays;
  }

  const daysPerWeek = clampInteger(
    Number.isFinite(organization.standardWorkDaysPerWeek)
      ? organization.standardWorkDaysPerWeek
      : DEFAULT_WEEKDAYS.length,
    1,
    7
  );
  return [1, 2, 3, 4, 5, 6, 7].slice(0, daysPerWeek);
}

function resolveDailyWorkMinutes(organization: OrganizationEntity) {
  const hours =
    Number.isFinite(organization.standardWorkHoursPerDay) && organization.standardWorkHoursPerDay > 0
      ? organization.standardWorkHoursPerDay
      : Number.isFinite(organization.workHoursPerDay) && organization.workHoursPerDay > 0
        ? organization.workHoursPerDay
        : DEFAULT_DAILY_WORK_HOURS;
  return clampInteger(Math.round(hours * 60), 60, 24 * 60);
}

function resolveStartMinute(organization: OrganizationEntity) {
  return parseTimeToMinute(organization.workStartTime) ?? DEFAULT_START_MINUTE;
}

function resolveEndMinute(organization: OrganizationEntity, startMinute: number, dailyWorkMinutes: number) {
  const explicitEnd = parseTimeToMinute(organization.workEndTime);
  if (explicitEnd !== null && explicitEnd > startMinute) {
    return explicitEnd;
  }
  const estimatedEnd = startMinute + dailyWorkMinutes + DEFAULT_BREAK_MINUTES;
  return Math.min(23 * 60 + 59, Math.max(startMinute + 1, estimatedEnd));
}

function toKstDateYmd(date: Date) {
  return formatKstDateYmd(date);
}

function toEndOfMonthYmd(dateYmd: string) {
  const [yearPart, monthPart] = dateYmd.split("-");
  const year = Number.parseInt(yearPart ?? "", 10);
  const month = Number.parseInt(monthPart ?? "", 10);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return dateYmd;
  }
  const day = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function resolveSeedWindow(anchorDate: Date | null | undefined): SeedScheduleWindow {
  const todayYmd = toKstDateYmd(new Date());
  const anchorYmd = anchorDate ? toKstDateYmd(anchorDate) : null;
  const fromDate = anchorYmd && anchorYmd > todayYmd ? anchorYmd : todayYmd;
  return {
    fromDate,
    toDate: toEndOfMonthYmd(fromDate)
  };
}

function hasScheduleOverlap(
  existingSchedules: Array<{ startAt: Date; endAt: Date }>,
  startAt: Date,
  endAt: Date
) {
  return existingSchedules.some((schedule) => schedule.startAt <= endAt && schedule.endAt >= startAt);
}

function resolveLookupRange() {
  return {
    periodStart: new Date(LOOKUP_RANGE_START_ISO),
    periodEnd: new Date(LOOKUP_RANGE_END_ISO)
  };
}

export async function organizationHasAnyWorkSchedules(dataAccess: DataAccess, organizationId: string) {
  const range = resolveLookupRange();
  const existing = await dataAccess.scheduling.listInPeriod({
    periodStart: range.periodStart,
    periodEnd: range.periodEnd,
    organizationId
  });
  return existing.length > 0;
}

export async function seedDefaultWorkSchedulesForEmployee(input: {
  dataAccess: DataAccess;
  employee: EmployeeEntity;
  anchorDate?: Date | null;
}) : Promise<SeedDefaultWorkSchedulesForEmployeeResult> {
  const { dataAccess, employee } = input;

  if (employee.status !== "ACTIVE") {
    return {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      window: null,
      candidateDays: 0,
      createdSchedules: 0,
      createdScheduleIds: [],
      skippedReason: "employee_not_active"
    };
  }

  if (!employee.organizationId) {
    return {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      window: null,
      candidateDays: 0,
      createdSchedules: 0,
      createdScheduleIds: [],
      skippedReason: "employee_has_no_organization"
    };
  }

  const organization = await dataAccess.organizations.findById(employee.organizationId);
  if (!organization) {
    return {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      window: null,
      candidateDays: 0,
      createdSchedules: 0,
      createdScheduleIds: [],
      skippedReason: "organization_not_found"
    };
  }

  const window = resolveSeedWindow(input.anchorDate);
  const weekdays = new Set<number>(normalizeWeekdaysFromOrganization(organization));
  const candidateDates = enumerateDateRange(window.fromDate, window.toDate).filter((dateYmd) =>
    weekdays.has(weekdayFromKstDate(dateYmd))
  );

  if (candidateDates.length === 0) {
    return {
      employeeId: employee.id,
      organizationId: employee.organizationId,
      window,
      candidateDays: 0,
      createdSchedules: 0,
      createdScheduleIds: [],
      skippedReason: "no_workdays_in_window"
    };
  }

  const startMinute = resolveStartMinute(organization);
  const endMinute = resolveEndMinute(organization, startMinute, resolveDailyWorkMinutes(organization));
  const rangeStart = dateTimeFromKstDateAndMinute(window.fromDate, 0);
  const rangeEnd = dateTimeFromKstDateAndMinute(window.toDate, 23 * 60 + 59);
  const existingSchedules = await dataAccess.scheduling.listInPeriod({
    periodStart: rangeStart,
    periodEnd: rangeEnd,
    organizationId: employee.organizationId,
    employeeId: employee.id
  });

  const mutableSchedules = [...existingSchedules];
  const createdScheduleIds: string[] = [];
  for (const dateYmd of candidateDates) {
    const startAt = dateTimeFromKstDateAndMinute(dateYmd, startMinute);
    const endAt = dateTimeFromKstDateAndMinute(dateYmd, endMinute);
    if (hasScheduleOverlap(mutableSchedules, startAt, endAt)) {
      continue;
    }
    const created = await dataAccess.scheduling.create({
      employeeId: employee.id,
      startAt,
      endAt,
      breakMinutes: DEFAULT_BREAK_MINUTES,
      isHoliday: false,
      notes: DEFAULT_SEED_NOTES
    });
    createdScheduleIds.push(created.id);
    mutableSchedules.push(created);
  }

  return {
    employeeId: employee.id,
    organizationId: employee.organizationId,
    window,
    candidateDays: candidateDates.length,
    createdSchedules: createdScheduleIds.length,
    createdScheduleIds,
    skippedReason: null
  };
}

export async function seedDefaultWorkSchedulesForOrganization(input: {
  dataAccess: DataAccess;
  organizationId: string;
  anchorDate?: Date | null;
  onlyIfNoSchedules?: boolean;
}) : Promise<SeedDefaultWorkSchedulesForOrganizationResult> {
  const { dataAccess, organizationId } = input;
  const checkedAt = new Date().toISOString();
  const onlyIfNoSchedules = input.onlyIfNoSchedules ?? true;
  const hasAnySchedulesBeforeSeed = await organizationHasAnyWorkSchedules(dataAccess, organizationId);
  const activeEmployees = await dataAccess.employees.list({
    organizationId,
    status: "ACTIVE"
  });

  if (onlyIfNoSchedules && hasAnySchedulesBeforeSeed) {
    return {
      organizationId,
      checkedAt,
      onlyIfNoSchedules,
      hasAnySchedulesBeforeSeed,
      totalActiveEmployees: activeEmployees.length,
      createdEmployees: 0,
      skippedEmployees: activeEmployees.length,
      createdSchedules: 0,
      employeeResults: []
    };
  }

  const employeeResults: SeedDefaultWorkSchedulesForEmployeeResult[] = [];
  for (const employee of activeEmployees) {
    employeeResults.push(
      await seedDefaultWorkSchedulesForEmployee({
        dataAccess,
        employee,
        anchorDate: input.anchorDate
      })
    );
  }

  const createdEmployees = employeeResults.filter((row) => row.createdSchedules > 0).length;
  const createdSchedules = employeeResults.reduce((sum, row) => sum + row.createdSchedules, 0);
  return {
    organizationId,
    checkedAt,
    onlyIfNoSchedules,
    hasAnySchedulesBeforeSeed,
    totalActiveEmployees: activeEmployees.length,
    createdEmployees,
    skippedEmployees: activeEmployees.length - createdEmployees,
    createdSchedules,
    employeeResults
  };
}
