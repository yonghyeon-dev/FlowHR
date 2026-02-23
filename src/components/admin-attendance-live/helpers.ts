export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function getTodayRangeLocal() {
  const now = new Date();
  return {
    from: toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)),
    to: toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 0))
  };
}

export function toIso(value: string) {
  return new Date(value).toISOString();
}

export function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (!value || value.trim().length === 0) {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function parseArray<T>(body: unknown, key: string): T[] {
  if (!body || typeof body !== "object") {
    return [];
  }
  const candidate = (body as Record<string, unknown>)[key];
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate as T[];
}

export function formatDateTime(value: string | null, locale: string) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(locale);
}

export function formatMinutes(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return "0m";
  }
  const rounded = Math.round(value);
  const hours = Math.floor(rounded / 60);
  const minutes = rounded % 60;
  if (hours <= 0) {
    return `${minutes}m`;
  }
  return `${hours}h ${minutes}m`;
}
