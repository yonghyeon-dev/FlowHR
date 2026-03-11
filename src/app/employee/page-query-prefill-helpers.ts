import type { AttendanceRecordDto } from "@/app/employee/page-types";

type SearchParamsLike = {
  get: (key: string) => string | null;
};

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const EMPLOYEE_FOCUS_SECTIONS = new Set([
  "account",
  "self-service-overview",
  "submit-checklist",
  "attendance",
  "leave",
  "leave-calendar",
  "schedule",
  "request-feedback",
  "request-search-sort",
  "request-timeline",
  "request-resubmit"
]);

const EMPLOYEE_FOCUS_ALIASES: Record<string, string> = {
  overview: "self-service-overview",
  checklist: "submit-checklist",
  correction: "attendance",
  "attendance-correction": "attendance",
  vacation: "leave",
  resubmit: "request-resubmit",
  timeline: "request-timeline"
};

const PROMOTED_ROUTE_SECTION_MAP: Record<string, string> = {
  attendance: "/employee/attendance/correction",
  leave: "/employee/leave/request",
  "leave-calendar": "/employee/leave/calendar",
  schedule: "/employee/schedule",
  "request-feedback": "/employee/requests/monitoring",
  "request-search-sort": "/employee/requests/monitoring",
  "request-timeline": "/employee/requests/monitoring",
  "request-resubmit": "/employee/requests/resubmit"
};

const RESUBMIT_CHANNEL_SET = new Set(["attendance", "leave"]);

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

export function resolveEmployeeFocusSectionId(
  searchParams: SearchParamsLike
): string | null {
  const rawFocus = searchParams.get("focus")?.trim().toLowerCase() ?? "";
  if (!rawFocus) {
    return null;
  }
  const normalizedFocus = EMPLOYEE_FOCUS_ALIASES[rawFocus] ?? rawFocus;
  if (!EMPLOYEE_FOCUS_SECTIONS.has(normalizedFocus)) {
    return null;
  }
  return normalizedFocus;
}

export function resolveEmployeePromotedRouteForFocusSection(
  focusSectionId: string | null
) {
  if (!focusSectionId) {
    return null;
  }
  return PROMOTED_ROUTE_SECTION_MAP[focusSectionId] ?? null;
}

export type EmployeeResubmitDraftPrefill = {
  key: string;
  channel: "attendance" | "leave";
  recordId: string;
};

export function resolveEmployeeResubmitDraftPrefill(
  searchParams: SearchParamsLike
): EmployeeResubmitDraftPrefill | null {
  const channel = searchParams.get("resubmitChannel")?.trim().toLowerCase() ?? "";
  const recordId = searchParams.get("resubmitRecordId")?.trim() ?? "";
  if (!RESUBMIT_CHANNEL_SET.has(channel) || recordId.length === 0) {
    return null;
  }
  return {
    key: `${channel}:${recordId}`,
    channel: channel as "attendance" | "leave",
    recordId
  };
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
