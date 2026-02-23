export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function getThisMonthRangeLocal() {
  const now = new Date();
  return {
    from: toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0)),
    to: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0))
  };
}

export function getLast30DaysRangeLocal() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  return {
    from: toLocalInputValue(new Date(from.getFullYear(), from.getMonth(), from.getDate(), 0, 0, 0)),
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

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function formatDelta(value: number, asPercent: boolean) {
  const prefix = value > 0 ? "+" : "";
  if (asPercent) {
    return `${prefix}${value.toFixed(1)}%p`;
  }
  return `${prefix}${value.toFixed(1)}`;
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
