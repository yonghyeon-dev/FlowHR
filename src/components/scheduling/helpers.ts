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
