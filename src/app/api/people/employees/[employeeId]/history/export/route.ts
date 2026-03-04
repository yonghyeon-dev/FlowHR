import type { AuditLogEntity } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail } from "@/lib/http";

type RouteContext = {
  params: Promise<{ employeeId: string }>;
};

type CsvHistoryRow = {
  date: string;
  action: string;
  field: string;
  oldValue: string;
  newValue: string;
  actorId: string;
};

const CSV_COLUMNS: Array<keyof CsvHistoryRow> = [
  "date",
  "action",
  "field",
  "oldValue",
  "newValue",
  "actorId"
];

const EMPLOYEE_HISTORY_ACTIONS = ["employee.created", "employee.profile.updated"] as const;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) {
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

function toIsoDate(value: unknown): string {
  const fallback = new Date().toISOString();
  if (value === null || value === undefined) {
    return fallback;
  }
  const date = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toISOString();
}

function valuesDiffer(left: unknown, right: unknown) {
  return stringifyValue(left) !== stringifyValue(right);
}

function toRowsFromAuditEntry(entry: AuditLogEntity): CsvHistoryRow[] {
  const payload = entry.payload;
  const base = {
    date: entry.createdAt.toISOString(),
    action: entry.action,
    actorId: entry.actorId ?? ""
  };

  if (
    isPlainObject(payload) &&
    isPlainObject(payload.before) &&
    isPlainObject(payload.after)
  ) {
    const before = payload.before;
    const after = payload.after;
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
    const changedRows = keys
      .filter((key) => valuesDiffer(before[key], after[key]))
      .map((key) => ({
        ...base,
        field: key,
        oldValue: stringifyValue(before[key]),
        newValue: stringifyValue(after[key])
      }));

    if (changedRows.length > 0) {
      return changedRows;
    }

    return [
      {
        ...base,
        field: "payload",
        oldValue: stringifyValue(before),
        newValue: stringifyValue(after)
      }
    ];
  }

  if (isPlainObject(payload)) {
    const keys = Object.keys(payload).sort();
    if (keys.length === 0) {
      return [
        {
          ...base,
          field: "payload",
          oldValue: "",
          newValue: ""
        }
      ];
    }
    return keys.map((key) => ({
      ...base,
      field: key,
      oldValue: "",
      newValue: stringifyValue(payload[key])
    }));
  }

  return [
    {
      ...base,
      field: "payload",
      oldValue: "",
      newValue: stringifyValue(payload)
    }
  ];
}

function toRowsFromEmployeeHistory(history: unknown): CsvHistoryRow[] {
  if (!Array.isArray(history)) {
    return [];
  }

  const rows: CsvHistoryRow[] = [];
  for (const item of history) {
    if (!isPlainObject(item)) {
      continue;
    }
    rows.push({
      date: toIsoDate(item.createdAt ?? item.date),
      action: typeof item.action === "string" ? item.action : "employee.history",
      field: typeof item.field === "string" ? item.field : "payload",
      oldValue: stringifyValue(item.oldValue),
      newValue: stringifyValue(item.newValue),
      actorId: typeof item.actorId === "string" ? item.actorId : ""
    });
  }
  return rows;
}

function escapeCsv(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, "\"\"")}"`;
  }
  return value;
}

function toCsv(rows: CsvHistoryRow[]): string {
  const header = CSV_COLUMNS.join(",");
  const body = rows.map((row) => CSV_COLUMNS.map((column) => escapeCsv(row[column])).join(","));
  return `\uFEFF${[header, ...body].join("\n")}`;
}

function toFileName(employeeId: string): string {
  const safeEmployeeId = employeeId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `employee-${safeEmployeeId}-history.csv`;
}

export async function GET(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "employee.history.export.unauthorized");
  }
  if (actor.role !== "admin") {
    return fail(403, "employee.history.export.forbidden", { reason: "admin_required" });
  }

  const { employeeId } = await context.params;
  const dataAccess = getRuntimeDataAccess();
  const employee = await dataAccess.employees.findById(employeeId);
  if (!employee) {
    return fail(404, "employee not found");
  }

  const auditRows = await dataAccess.audit.list({
    actions: [...EMPLOYEE_HISTORY_ACTIONS],
    entityType: "Employee",
    entityId: employeeId,
    ...(employee.organizationId ? { organizationId: employee.organizationId } : {}),
    limit: 1000
  });

  const rowsFromAudit = auditRows.flatMap(toRowsFromAuditEntry);
  const rows =
    rowsFromAudit.length > 0
      ? rowsFromAudit
      : toRowsFromEmployeeHistory((employee as { history?: unknown }).history);

  return new Response(toCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${toFileName(employeeId)}"`
    }
  });
}

