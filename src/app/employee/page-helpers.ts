import type {
  RequestSearchRow,
  RequestSearchScope,
  RequestSortOption
} from "@/app/employee/page-types";

export function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function todayStartLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0));
}

export function todayEndLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0));
}

export function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

export function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

export function toIso(value: string) {
  return new Date(value).toISOString();
}

export function toLocalDateKey(value: Date | string) {
  const parsed = typeof value === "string" ? new Date(value) : value;
  const adjusted = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 10);
}

export function startOfLocalDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

export function shiftDays(value: Date, days: number) {
  const shifted = new Date(value);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

export function coerceNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

export function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function formatDateTime(value: string | null, runtimeLocale = "ko-KR") {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(runtimeLocale);
}

export function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function toTimestamp(value: string | null) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

export function calculateNetMinutes(input: {
  checkInAt: string;
  checkOutAt: string | null;
  breakMinutes: number;
}) {
  const checkInMs = new Date(input.checkInAt).getTime();
  if (Number.isNaN(checkInMs)) {
    return null;
  }
  if (!input.checkOutAt) {
    return null;
  }
  const checkOutMs = new Date(input.checkOutAt).getTime();
  if (Number.isNaN(checkOutMs) || checkOutMs <= checkInMs) {
    return null;
  }
  const grossMinutes = Math.round((checkOutMs - checkInMs) / 60_000);
  return grossMinutes - Math.max(0, Math.trunc(input.breakMinutes));
}

export function statusToTone(status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") {
  if (status === "APPROVED") {
    return "ok";
  }
  if (status === "PENDING") {
    return "pending";
  }
  return "fail";
}

export function statusSortRank(status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED") {
  if (status === "PENDING") {
    return 0;
  }
  if (status === "REJECTED") {
    return 1;
  }
  if (status === "CANCELED") {
    return 2;
  }
  return 3;
}

export function sortRequestRowsByOption(rows: RequestSearchRow[], sortOption: RequestSortOption) {
  return [...rows].sort((left, right) => {
    if (sortOption === "latest_desc") {
      return toTimestamp(right.at) - toTimestamp(left.at);
    }
    if (sortOption === "oldest_asc") {
      return toTimestamp(left.at) - toTimestamp(right.at);
    }
    if (sortOption === "status") {
      const statusDiff = statusSortRank(left.status) - statusSortRank(right.status);
      if (statusDiff !== 0) {
        return statusDiff;
      }
      return toTimestamp(right.at) - toTimestamp(left.at);
    }
    const pendingDiff = Number(right.status === "PENDING") - Number(left.status === "PENDING");
    if (pendingDiff !== 0) {
      return pendingDiff;
    }
    if (right.status === "PENDING" && left.status === "PENDING") {
      const waitDiff = right.pendingHours - left.pendingHours;
      if (waitDiff !== 0) {
        return waitDiff;
      }
    }
    return toTimestamp(right.at) - toTimestamp(left.at);
  });
}

export function matchesRequestSearch(scope: RequestSearchScope, query: string, row: RequestSearchRow) {
  if (!query) {
    return true;
  }
  const normalizedRequestId = row.requestId.toLowerCase();
  const normalizedStatus = row.status.toLowerCase();
  const normalizedContent = `${row.summary} ${row.detail} ${row.channel}`.toLowerCase();

  if (scope === "request_id") {
    return normalizedRequestId.includes(query);
  }
  if (scope === "status") {
    return normalizedStatus.includes(query);
  }
  if (scope === "content") {
    return normalizedContent.includes(query);
  }
  return `${normalizedRequestId} ${normalizedStatus} ${normalizedContent}`.includes(query);
}

export function estimateLeaveRequestedDays(input: {
  startDate: string;
  endDate: string;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hoursInput: string;
}) {
  if (input.unit === "HALF_DAY") {
    return 0.5;
  }
  if (input.unit === "HOUR") {
    return Math.max(0, coerceNumber(input.hoursInput)) / 8;
  }

  const startMs = new Date(input.startDate).getTime();
  const endMs = new Date(input.endDate).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs < startMs) {
    return 0;
  }
  const dayMs = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.ceil((endMs - startMs + 1) / dayMs));
}
