import type { WorkScheduleTemplateEntity } from "@/features/shared/data-access";
import { dateTimeFromKstDateAndMinute } from "@/features/scheduling/template-date-helpers";

export type GeneratedScheduleWindow = {
  date: string;
  templateId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | undefined;
};

export function rotateTemplatesByOffset(
  templates: WorkScheduleTemplateEntity[],
  offset: number
): WorkScheduleTemplateEntity[] {
  if (templates.length === 0) {
    return [];
  }
  const normalizedOffset = ((offset % templates.length) + templates.length) % templates.length;
  if (normalizedOffset === 0) {
    return [...templates];
  }
  return [...templates.slice(normalizedOffset), ...templates.slice(0, normalizedOffset)];
}

export function buildScheduleWindowFromTemplateDate(template: WorkScheduleTemplateEntity, dateYmd: string) {
  const startAt = dateTimeFromKstDateAndMinute(dateYmd, template.startMinute);
  let endAt = dateTimeFromKstDateAndMinute(dateYmd, template.endMinute);
  if (template.endMinute <= template.startMinute) {
    endAt = new Date(endAt.getTime() + 24 * 60 * 60 * 1000);
  }
  return { startAt, endAt };
}

export function buildRotationWindowsForTemplates(
  templates: WorkScheduleTemplateEntity[],
  matchedDates: string[]
) {
  return matchedDates.map((date, index) => {
    const template = templates[index % templates.length];
    const window = buildScheduleWindowFromTemplateDate(template, date);
    return {
      date,
      templateId: template.id,
      startAt: window.startAt,
      endAt: window.endAt,
      breakMinutes: template.breakMinutes,
      isHoliday: template.isHoliday,
      notes: template.notes ?? undefined
    } satisfies GeneratedScheduleWindow;
  });
}

export function buildTemplateRangeWindows(template: WorkScheduleTemplateEntity, matchedDates: string[]) {
  return buildRotationWindowsForTemplates([template], matchedDates);
}
