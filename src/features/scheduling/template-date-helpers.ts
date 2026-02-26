import { ServiceError } from "@/features/shared/service-error";

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TEMPLATE_ASSIGNMENT_RANGE_DAYS = 62;

export function parseDateToKstBase(dateYmd: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateYmd)) {
    throw new ServiceError(400, "date must follow YYYY-MM-DD");
  }
  const base = new Date(`${dateYmd}T00:00:00+09:00`);
  if (Number.isNaN(base.getTime())) {
    throw new ServiceError(400, "invalid date");
  }
  return base;
}

export function weekdayFromKstDate(dateYmd: string) {
  const base = parseDateToKstBase(dateYmd);
  const shiftedToKst = new Date(base.getTime() + KST_OFFSET_MS);
  const weekdayJs = shiftedToKst.getUTCDay();
  return weekdayJs === 0 ? 7 : weekdayJs;
}

export function weekdayFromKstDateTime(dateTime: Date) {
  const shiftedToKst = new Date(dateTime.getTime() + KST_OFFSET_MS);
  const weekdayJs = shiftedToKst.getUTCDay();
  return weekdayJs === 0 ? 7 : weekdayJs;
}

export function dateTimeFromKstDateAndMinute(dateYmd: string, minute: number) {
  const base = parseDateToKstBase(dateYmd);
  return new Date(base.getTime() + minute * 60_000);
}

export function formatKstDateYmd(base: Date) {
  const shifted = new Date(base.getTime() + KST_OFFSET_MS);
  return shifted.toISOString().slice(0, 10);
}

export function enumerateDateRange(
  fromDate: string,
  toDate: string,
  maxDays: number = MAX_TEMPLATE_ASSIGNMENT_RANGE_DAYS
) {
  const start = parseDateToKstBase(fromDate);
  const end = parseDateToKstBase(toDate);
  if (end < start) {
    throw new ServiceError(400, "toDate must be on or after fromDate");
  }

  const totalDays = Math.floor((end.getTime() - start.getTime()) / ONE_DAY_MS) + 1;
  if (totalDays > maxDays) {
    throw new ServiceError(400, `date range too large; maximum is ${maxDays} days`);
  }

  const dates: string[] = [];
  for (let index = 0; index < totalDays; index += 1) {
    dates.push(formatKstDateYmd(new Date(start.getTime() + index * ONE_DAY_MS)));
  }
  return dates;
}

export function enumerateTemplateMatchedDates(fromDate: string, toDate: string, weekdays: number[]) {
  const dates = enumerateDateRange(fromDate, toDate);
  const matched = dates.filter((dateYmd) => weekdays.includes(weekdayFromKstDate(dateYmd)));
  if (matched.length === 0) {
    throw new ServiceError(400, "no dates in range match template weekdays");
  }
  return matched;
}
