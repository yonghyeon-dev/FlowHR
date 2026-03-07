import { Prisma } from "@prisma/client";
import { z } from "zod";

import { getMemoryAuditEntries } from "@/features/shared/memory-data-access";
import { prisma } from "@/lib/prisma";

export type AuditLogListItem = {
  action: string;
  entityType: string;
  entityId: string | null;
  organizationId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: Date;
};

const DEFAULT_AUDIT_LOG_RANGE_MS = 30 * 24 * 60 * 60 * 1000;

const listAuditLogsQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  entityType: z.string().trim().min(1).optional(),
  actorId: z.string().trim().min(1).optional(),
  action: z.string().trim().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  offset: z.coerce.number().int().min(0).optional()
});

export type ListAuditLogsQuery = {
  from: Date;
  to: Date;
  entityType?: string;
  actorId?: string;
  action?: string;
  limit: number;
  offset: number;
};

function normalizeOffsetDateTime(value: string | null) {
  return value ? value.replace(/ /g, "+") : value;
}

function toDate(value: string) {
  return new Date(value);
}

function buildDefaultAuditLogRange(now: Date) {
  const to = new Date(now.getTime());
  const from = new Date(to.getTime() - DEFAULT_AUDIT_LOG_RANGE_MS);
  return { from, to };
}

export function parseAuditLogListQuery(url: URL, now = new Date()) {
  const parsed = listAuditLogsQuerySchema.safeParse({
    from: normalizeOffsetDateTime(url.searchParams.get("from")) ?? undefined,
    to: normalizeOffsetDateTime(url.searchParams.get("to")) ?? undefined,
    entityType: url.searchParams.get("entityType") ?? undefined,
    actorId: url.searchParams.get("actorId") ?? undefined,
    action: url.searchParams.get("action") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined
  });

  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.flatten()
    };
  }

  const defaultRange = buildDefaultAuditLogRange(now);
  const from = parsed.data.from ? toDate(parsed.data.from) : defaultRange.from;
  const to = parsed.data.to ? toDate(parsed.data.to) : defaultRange.to;
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

  return {
    ok: true as const,
    query: {
      from,
      to,
      entityType: parsed.data.entityType,
      actorId: parsed.data.actorId,
      action: parsed.data.action,
      limit: parsed.data.limit ?? 50,
      offset: parsed.data.offset ?? 0
    } satisfies ListAuditLogsQuery
  };
}

function withActionFilter(rows: AuditLogListItem[], action: string | undefined) {
  if (!action) {
    return rows;
  }
  const normalized = action.trim().toLowerCase();
  return rows.filter((row) => row.action.trim().toLowerCase() === normalized);
}

function compareDescCreatedAt(left: AuditLogListItem, right: AuditLogListItem) {
  return right.createdAt.getTime() - left.createdAt.getTime();
}

function matchesDateRange(createdAt: Date, from: Date, to: Date) {
  const createdAtMs = createdAt.getTime();
  return createdAtMs >= from.getTime() && createdAtMs <= to.getTime();
}

async function listFromMemory(input: {
  organizationId: string;
  query: ListAuditLogsQuery;
}) {
  const filtered = withActionFilter(
    getMemoryAuditEntries()
      .filter((row) => row.organizationId === input.organizationId)
      .filter((row) => matchesDateRange(row.createdAt, input.query.from, input.query.to))
      .filter((row) => (input.query.entityType ? row.entityType === input.query.entityType : true))
      .filter((row) => (input.query.actorId ? row.actorId === input.query.actorId : true))
      .sort(compareDescCreatedAt),
    input.query.action
  );

  return {
    items: filtered.slice(input.query.offset, input.query.offset + input.query.limit),
    total: filtered.length
  };
}

function toPrismaWhere(input: { organizationId: string; query: ListAuditLogsQuery }): Prisma.AuditLogWhereInput {
  return {
    organizationId: input.organizationId,
    createdAt: {
      gte: input.query.from,
      lte: input.query.to
    },
    ...(input.query.entityType ? { entityType: input.query.entityType } : {}),
    ...(input.query.actorId ? { actorId: input.query.actorId } : {}),
    ...(input.query.action ? { action: input.query.action } : {})
  };
}

function toAuditListItem(record: {
  action: string;
  entityType: string;
  entityId: string | null;
  organizationId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: Prisma.JsonValue | null;
  createdAt: Date;
}): AuditLogListItem {
  return {
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    organizationId: record.organizationId,
    actorRole: record.actorRole,
    actorId: record.actorId,
    payload: record.payload,
    createdAt: record.createdAt
  };
}

async function listFromPrisma(input: {
  organizationId: string;
  query: ListAuditLogsQuery;
}) {
  const where = toPrismaWhere(input);
  const [records, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.query.limit,
      skip: input.query.offset
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    items: records.map(toAuditListItem),
    total
  };
}

export async function listAuditLogs(input: { organizationId: string; query: ListAuditLogsQuery }) {
  const mode = process.env.FLOWHR_DATA_ACCESS?.trim().toLowerCase();
  if (mode === "memory") {
    return listFromMemory(input);
  }
  return listFromPrisma(input);
}

function escapeCsv(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function toCsvValue(value: unknown) {
  if (value === undefined || value === null) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function toAuditLogsCsv(items: AuditLogListItem[]) {
  const header = "timestamp,entityType,entityId,action,actorId,changes";
  const rows = items.map((item) =>
    [
      item.createdAt.toISOString(),
      item.entityType,
      item.entityId ?? "",
      item.action,
      item.actorId ?? "",
      toCsvValue(item.payload)
    ]
      .map(escapeCsv)
      .join(",")
  );
  return `\uFEFF${[header, ...rows].join("\n")}`;
}
