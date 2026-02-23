export function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
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
  return Array.isArray(candidate) ? (candidate as T[]) : [];
}

export function safeParseBody(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function pastDaysRangeIso(days: number, now = new Date()) {
  const from = new Date(now);
  from.setDate(now.getDate() - Math.max(1, days));
  return { from: from.toISOString(), to: now.toISOString() };
}
