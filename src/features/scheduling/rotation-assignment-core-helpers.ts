import type { WorkScheduleEntity, WorkScheduleTemplateEntity } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import { weekdaySetKey } from "@/features/scheduling/rotation-fairness-core-helpers";
import type { GeneratedScheduleWindow } from "@/features/scheduling/rotation-window-helpers";

type ResolveTemplateById = (templateId: string) => Promise<WorkScheduleTemplateEntity>;

export async function requireTemplatesWithinTenant(templateIds: string[], resolveTemplateById: ResolveTemplateById) {
  const rows: WorkScheduleTemplateEntity[] = [];
  for (const templateId of templateIds) {
    const template = await resolveTemplateById(templateId);
    rows.push(template);
  }
  return rows;
}

export function ensureRotationTemplatesShareWeekdaySet(
  templates: WorkScheduleTemplateEntity[],
  templateIds: string[]
) {
  const baseWeekdayKey = weekdaySetKey(templates[0].weekdays);
  for (const template of templates) {
    if (weekdaySetKey(template.weekdays) !== baseWeekdayKey) {
      throw new ServiceError(409, "all rotation templates must share same weekday set", {
        templateIds
      });
    }
  }
}

type ListSchedulesInPeriod = (input: {
  periodStart: Date;
  periodEnd: Date;
  organizationId?: string;
  employeeId?: string;
}) => Promise<Array<Pick<WorkScheduleEntity, "id" | "startAt" | "endAt">>>;

export async function ensureNoOverlapsForGeneratedWindows(input: {
  organizationId?: string;
  employeeId: string;
  windows: GeneratedScheduleWindow[];
  listSchedulesInPeriod: ListSchedulesInPeriod;
}) {
  if (input.windows.length === 0) {
    throw new ServiceError(400, "no schedules generated from requested range");
  }

  const firstStart = input.windows.reduce(
    (min, row) => (row.startAt.getTime() < min.getTime() ? row.startAt : min),
    input.windows[0].startAt
  );
  const lastEnd = input.windows.reduce(
    (max, row) => (row.endAt.getTime() > max.getTime() ? row.endAt : max),
    input.windows[0].endAt
  );

  const existing = await input.listSchedulesInPeriod({
    periodStart: firstStart,
    periodEnd: lastEnd,
    organizationId: input.organizationId,
    employeeId: input.employeeId
  });

  for (const candidate of input.windows) {
    const overlaps = existing.filter(
      (current) => current.startAt < candidate.endAt && current.endAt > candidate.startAt
    );
    if (overlaps.length > 0) {
      throw new ServiceError(409, "overlapping schedule exists", {
        employeeId: input.employeeId,
        templateId: candidate.templateId,
        date: candidate.date,
        overlapCount: overlaps.length,
        overlappingScheduleIds: overlaps.map((schedule) => schedule.id)
      });
    }
  }

  for (let index = 0; index < input.windows.length; index += 1) {
    for (let next = index + 1; next < input.windows.length; next += 1) {
      const left = input.windows[index];
      const right = input.windows[next];
      if (left.startAt < right.endAt && left.endAt > right.startAt) {
        throw new ServiceError(409, "generated schedules overlap within requested range", {
          employeeId: input.employeeId,
          leftDate: left.date,
          leftTemplateId: left.templateId,
          rightDate: right.date,
          rightTemplateId: right.templateId
        });
      }
    }
  }
}

type CreateScheduleFromGeneratedWindow = (input: {
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
}) => Promise<Pick<WorkScheduleEntity, "id">>;

export async function createSchedulesFromGeneratedWindows(input: {
  employeeId: string;
  windows: GeneratedScheduleWindow[];
  createSchedule: CreateScheduleFromGeneratedWindow;
}) {
  const createdScheduleIds: string[] = [];
  for (const candidate of input.windows) {
    const created = await input.createSchedule({
      employeeId: input.employeeId,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      breakMinutes: candidate.breakMinutes,
      isHoliday: candidate.isHoliday,
      notes: candidate.notes
    });
    createdScheduleIds.push(created.id);
  }
  return createdScheduleIds;
}
