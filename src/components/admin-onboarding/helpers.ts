export type DepartmentSeedDraft = {
  code: string;
  name: string;
};

export type EmployeeSeedDraft = {
  id: string;
  name: string;
  email: string;
  departmentCode: string | null;
};

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
  if (!Array.isArray(candidate)) {
    return [];
  }
  return candidate as T[];
}

export function parseDepartmentSeedInput(raw: string): DepartmentSeedDraft[] {
  const rows: DepartmentSeedDraft[] = [];
  const seenCodes = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    const [codeRaw, nameRaw] = trimmed.split(",");
    const code = (codeRaw ?? "").trim();
    const name = (nameRaw ?? "").trim();
    if (!code || !name) {
      continue;
    }
    const key = code.toLowerCase();
    if (seenCodes.has(key)) {
      continue;
    }
    seenCodes.add(key);
    rows.push({ code, name });
  }

  return rows;
}

export function parseEmployeeSeedInput(raw: string): EmployeeSeedDraft[] {
  const rows: EmployeeSeedDraft[] = [];
  const seenIds = new Set<string>();

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    const [idRaw, nameRaw, emailRaw, departmentCodeRaw] = trimmed.split(",");
    const id = (idRaw ?? "").trim();
    const name = (nameRaw ?? "").trim();
    const email = (emailRaw ?? "").trim();
    const departmentCode = (departmentCodeRaw ?? "").trim();

    if (!id || !email) {
      continue;
    }

    const key = id.toLowerCase();
    if (seenIds.has(key)) {
      continue;
    }
    seenIds.add(key);

    rows.push({
      id,
      name: name || id,
      email,
      departmentCode: departmentCode || null
    });
  }

  return rows;
}

export function normalizeInt(value: string, fallback: number, min: number) {
  const parsed = Math.floor(Number(value));
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(min, parsed);
}

export function safeParseBody(text: string) {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}
