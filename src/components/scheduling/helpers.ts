export type WorkScheduleDto = {
  id: string;
  employeeId: string;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ScheduleApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
  body?: unknown;
};

export type ScheduleTimeStatus = "upcoming" | "in_progress" | "completed";
export type ScheduleStatusFilter = "all" | ScheduleTimeStatus;
export type ScheduleHolidayFilter = "all" | "holiday" | "workday";

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

export function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function toDateTimeLocalValue(date: Date) {
  return `${toDateInputValue(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function buildCurrentMonthDateRange(baseDate = new Date()) {
  const from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const to = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  return {
    fromDate: toDateInputValue(from),
    toDate: toDateInputValue(to)
  };
}

function buildWeekDateRange(start: Date) {
  const from = new Date(start);
  const to = new Date(start);
  to.setDate(to.getDate() + 6);
  return {
    fromDate: toDateInputValue(from),
    toDate: toDateInputValue(to)
  };
}

export function buildCurrentWeekDateRange(baseDate = new Date()) {
  const date = new Date(baseDate);
  const dayOfWeek = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayOfWeek);
  return buildWeekDateRange(date);
}

export function buildNextWeekDateRange(baseDate = new Date()) {
  const date = new Date(baseDate);
  const dayOfWeek = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - dayOfWeek + 7);
  return buildWeekDateRange(date);
}

export function buildDefaultScheduleWindow(baseDate = new Date()) {
  const start = new Date(baseDate);
  start.setHours(9, 0, 0, 0);
  const end = new Date(baseDate);
  end.setHours(18, 0, 0, 0);
  return {
    startAt: toDateTimeLocalValue(start),
    endAt: toDateTimeLocalValue(end)
  };
}

export function toIsoDateRangeStart(value: string) {
  if (!value) {
    return "";
  }
  return new Date(`${value}T00:00:00`).toISOString();
}

export function toIsoDateRangeEndExclusive(value: string) {
  if (!value) {
    return "";
  }
  const end = new Date(`${value}T00:00:00`);
  end.setDate(end.getDate() + 1);
  return end.toISOString();
}

export function toIsoDateTime(value: string) {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString();
}

export function buildQuery(params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim().length === 0) {
      continue;
    }
    query.set(key, value.trim());
  }
  const text = query.toString();
  return text.length > 0 ? `?${text}` : "";
}

export async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.trim().length === 0) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function extractErrorMessage(body: unknown, isKoLocale: boolean) {
  if (!body) {
    return isKoLocale ? "오류 원인을 확인할 수 없습니다." : "Unable to identify the failure cause.";
  }

  if (typeof body === "string") {
    return body;
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    return String(body);
  }

  const payload = body as Record<string, unknown>;
  const keys = ["error", "message", "reason", "detail"] as const;
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return JSON.stringify(body);
}

export function formatDateTime(value: string, runtimeLocale: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

export function formatHours(totalMinutes: number) {
  return (totalMinutes / 60).toFixed(1);
}

export function resolveScheduleWorkMinutes(schedule: WorkScheduleDto) {
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return 0;
  }
  return Math.max(0, Math.round((end - start) / 60000) - schedule.breakMinutes);
}

export function resolveScheduleTimeStatus(
  schedule: Pick<WorkScheduleDto, "startAt" | "endAt">,
  nowMs = Date.now()
): ScheduleTimeStatus {
  const start = new Date(schedule.startAt).getTime();
  const end = new Date(schedule.endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return "completed";
  }
  if (nowMs < start) {
    return "upcoming";
  }
  if (nowMs >= end) {
    return "completed";
  }
  return "in_progress";
}

function escapeCsvValue(value: string) {
  const normalized = value.replace(/"/g, "\"\"");
  return `"${normalized}"`;
}

export function exportScheduleRowsCsv(input: {
  rows: Array<{ schedule: WorkScheduleDto; status: ScheduleTimeStatus }>;
  runtimeLocale: string;
  isKoLocale: boolean;
}) {
  if (input.rows.length === 0) {
    return false;
  }

  const headers = input.isKoLocale
    ? ["스케줄 ID", "상태", "시작", "종료", "휴일", "휴게(분)", "메모"]
    : ["Schedule ID", "Status", "Start", "End", "Holiday", "Break Minutes", "Notes"];
  const lines = input.rows.map((row) => {
    const { schedule } = row;
    const values = [
      schedule.id,
      row.status,
      formatDateTime(schedule.startAt, input.runtimeLocale),
      formatDateTime(schedule.endAt, input.runtimeLocale),
      schedule.isHoliday ? "Y" : "N",
      String(schedule.breakMinutes),
      schedule.notes?.trim() ?? ""
    ];
    return values.map(escapeCsvValue).join(",");
  });

  const csv = [headers.map(escapeCsvValue).join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = objectUrl;
  anchor.download = `employee-schedule-${stamp}.csv`;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
  return true;
}
