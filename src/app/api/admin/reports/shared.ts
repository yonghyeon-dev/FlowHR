import { z } from "zod";

import { readActor } from "@/lib/actor";
import { fail } from "@/lib/http";

const reportRangeQuerySchema = z.object({
  from: z.string().datetime({ offset: true }),
  to: z.string().datetime({ offset: true }),
  departmentId: z.string().trim().min(1).optional()
});

function normalizeOffsetDateTime(value: string | null) {
  return value ? value.replace(/ /g, "+") : value;
}

function toDate(value: string) {
  return new Date(value);
}

type ReportRangeQueryInput = {
  from: Date;
  to: Date;
  departmentId?: string;
};

export function parseReportRangeQuery(url: URL, options?: { includeDepartmentId?: boolean }) {
  const includeDepartmentId = options?.includeDepartmentId ?? false;
  const parsed = reportRangeQuerySchema.safeParse({
    from: normalizeOffsetDateTime(url.searchParams.get("from")),
    to: normalizeOffsetDateTime(url.searchParams.get("to")),
    departmentId: includeDepartmentId ? url.searchParams.get("departmentId") ?? undefined : undefined
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.flatten()
    };
  }

  const from = toDate(parsed.data.from);
  const to = toDate(parsed.data.to);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          from: ["from and to must be valid datetime strings"]
        }
      }
    };
  }
  if (from.getTime() > to.getTime()) {
    return {
      ok: false as const,
      error: {
        fieldErrors: {
          from: ["from must be less than or equal to to"]
        }
      }
    };
  }

  const query: ReportRangeQueryInput = {
    from,
    to
  };
  if (includeDepartmentId && parsed.data.departmentId) {
    query.departmentId = parsed.data.departmentId;
  }

  return {
    ok: true as const,
    query
  };
}

export async function requireAdmin(request: Request, namespace: string) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, `${namespace}.unauthorized`)
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, `${namespace}.forbidden`, { reason: "admin_required" })
    };
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, `${namespace}.organization_id_required`)
    };
  }

  return {
    ok: true as const,
    organizationId
  };
}

function toCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return String(value);
}

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

export function toCsv(columns: string[], rows: unknown[][]) {
  const header = columns.join(",");
  const body = rows.map((row) => row.map((value) => escapeCsv(toCsvValue(value))).join(","));
  return `\uFEFF${[header, ...body].join("\n")}`;
}

export function toExportFileName(prefix: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${stamp}.csv`;
}

export function resolveEmployeeName(input: { name: string | null; id: string }) {
  const name = input.name?.trim() ?? "";
  return name.length > 0 ? name : input.id;
}

export function formatDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function formatDateTime(value: Date | null) {
  return value ? value.toISOString() : "";
}

export function formatHoursFromMinutes(totalMinutes: number) {
  const safe = Number.isFinite(totalMinutes) ? Math.max(0, totalMinutes) : 0;
  return (safe / 60).toFixed(2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readNestedNumber(value: unknown, path: string[]): number | null {
  let cursor: unknown = value;
  for (const segment of path) {
    if (!isRecord(cursor)) {
      return null;
    }
    cursor = cursor[segment];
  }
  if (typeof cursor === "number" && Number.isFinite(cursor)) {
    return cursor;
  }
  if (typeof cursor === "string") {
    const parsed = Number(cursor);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

