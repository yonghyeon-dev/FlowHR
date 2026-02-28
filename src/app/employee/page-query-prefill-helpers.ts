import type { AttendanceRecordDto } from "@/app/employee/page-types";

type SearchParamsLike = {
  get: (key: string) => string | null;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export type AttendanceCorrectionSchedulePrefill = {
  key: string;
  fromDate: string;
  toDate: string;
  checkInAt: string;
  checkOutAt: string;
  note: string;
};

function parseDateKey(dateKey: string) {
  if (!DATE_KEY_PATTERN.test(dateKey)) {
    return null;
  }
  const parsed = new Date(`${dateKey}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
}

function toDateKeyLocal(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

function buildScheduleCorrectionNote(
  correctionRequestNote: string,
  isKoLocale: boolean,
  fromDate: string,
  toDate: string
) {
  const rangeLabel = `${fromDate}~${toDate}`;
  return isKoLocale
    ? `${correctionRequestNote} (${rangeLabel})`
    : `Schedule ${correctionRequestNote.toLowerCase()} (${rangeLabel})`;
}

export function resolveAttendanceCorrectionSchedulePrefill(input: {
  searchParams: SearchParamsLike;
  correctionRequestNote: string;
  isKoLocale: boolean;
}): AttendanceCorrectionSchedulePrefill | null {
  const source = input.searchParams.get("attendanceSource")?.trim().toLowerCase();
  if (source !== "schedule") {
    return null;
  }

  const rawFromDate = input.searchParams.get("fromDate")?.trim() ?? "";
  const rawToDate = input.searchParams.get("toDate")?.trim() ?? "";
  const parsedFromDate = parseDateKey(rawFromDate);
  const parsedToDate = parseDateKey(rawToDate);
  if (!parsedFromDate || !parsedToDate) {
    return null;
  }

  const rangeStart = parsedFromDate <= parsedToDate ? parsedFromDate : parsedToDate;
  const rangeEnd = parsedFromDate <= parsedToDate ? parsedToDate : parsedFromDate;
  const fromDate = toDateKeyLocal(rangeStart);
  const toDate = toDateKeyLocal(rangeEnd);

  return {
    key: `schedule:${fromDate}:${toDate}`,
    fromDate,
    toDate,
    checkInAt: `${fromDate}T09:00`,
    checkOutAt: `${toDate}T18:00`,
    note: buildScheduleCorrectionNote(
      input.correctionRequestNote,
      input.isKoLocale,
      fromDate,
      toDate
    )
  };
}

export function resolveAttendanceCorrectionTargetFromScheduleRange(
  attendance: AttendanceRecordDto[],
  prefill: AttendanceCorrectionSchedulePrefill
) {
  if (attendance.length === 0) {
    return null;
  }

  const rangeStartMs = new Date(`${prefill.fromDate}T00:00:00`).getTime();
  const rangeEndMs = new Date(`${prefill.toDate}T23:59:59.999`).getTime();
  if (!Number.isFinite(rangeStartMs) || !Number.isFinite(rangeEndMs)) {
    return null;
  }

  let bestCandidate: AttendanceRecordDto | null = null;
  let bestCheckInMs = Number.NEGATIVE_INFINITY;
  for (const record of attendance) {
    const checkInMs = new Date(record.checkInAt).getTime();
    if (!Number.isFinite(checkInMs)) {
      continue;
    }
    if (checkInMs < rangeStartMs || checkInMs > rangeEndMs) {
      continue;
    }
    if (!bestCandidate || checkInMs > bestCheckInMs) {
      bestCandidate = record;
      bestCheckInMs = checkInMs;
    }
  }

  return bestCandidate;
}
