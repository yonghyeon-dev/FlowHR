import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type AuditSignOffStatus = "pending" | "signed" | "rejected";

export type AuditSignOffEntry = {
  role: ReviewHandoffRole;
  status: AuditSignOffStatus;
  actorId: string;
  note: string;
  signedAt: string | null;
};

export type CloseOffPackageSummary = {
  totalCount: number;
  signedCount: number;
  pendingCount: number;
  rejectedCount: number;
  handoffReady: boolean;
  exportReady: boolean;
  readyToArchive: boolean;
  blockers: string[];
};

export function parseBooleanQueryParam(value: string | null) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function buildReviewCloseOffRouteHref(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  value: number | null;
  ownerRole: string;
  ownerActorId: string;
  handoffReady: boolean;
  exportReady: boolean;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level,
    handoffReady: options.handoffReady ? "1" : "0",
    exportReady: options.exportReady ? "1" : "0"
  });
  if (options.value !== null) {
    query.set("value", String(options.value));
  }
  if (options.ownerRole.trim().length > 0) {
    query.set("ownerRole", options.ownerRole.trim());
  }
  if (options.ownerActorId.trim().length > 0) {
    query.set("ownerActorId", options.ownerActorId.trim());
  }
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off?${query.toString()}`;
}

export function buildDefaultAuditSignOffEntries(ownerActorId: string) {
  const operator = ownerActorId.trim();
  return [
    {
      role: "payroll_operator",
      status: "pending",
      actorId: operator,
      note: "",
      signedAt: null
    },
    {
      role: "manager",
      status: "pending",
      actorId: "",
      note: "",
      signedAt: null
    },
    {
      role: "admin",
      status: "pending",
      actorId: "",
      note: "",
      signedAt: null
    }
  ] satisfies AuditSignOffEntry[];
}

export function buildAuditSignOffEntry(input: {
  role: ReviewHandoffRole;
  status: AuditSignOffStatus;
  actorId: string;
  note: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    role: input.role,
    status: input.status,
    actorId: input.actorId.trim(),
    note: input.note.trim(),
    signedAt: input.status === "pending" ? null : now.toISOString()
  } satisfies AuditSignOffEntry;
}

export function applyAuditSignOffDecision(options: {
  entries: readonly AuditSignOffEntry[];
  role: ReviewHandoffRole;
  status: AuditSignOffStatus;
  actorId: string;
  note: string;
  now?: Date;
}) {
  const signed = buildAuditSignOffEntry({
    role: options.role,
    status: options.status,
    actorId: options.actorId,
    note: options.note,
    now: options.now
  });
  return options.entries.map((entry) => {
    if (entry.role !== options.role) {
      return entry;
    }
    return signed;
  });
}

export function summarizeCloseOffPackage(options: {
  entries: readonly AuditSignOffEntry[];
  handoffReady: boolean;
  exportReady: boolean;
}): CloseOffPackageSummary {
  const totalCount = options.entries.length;
  const signedCount = options.entries.filter((entry) => entry.status === "signed").length;
  const pendingCount = options.entries.filter((entry) => entry.status === "pending").length;
  const rejectedCount = options.entries.filter((entry) => entry.status === "rejected").length;
  const blockers: string[] = [];
  if (!options.handoffReady) {
    blockers.push("handoff snapshot is not ready");
  }
  if (!options.exportReady) {
    blockers.push("export snapshot is not ready");
  }
  if (pendingCount > 0) {
    blockers.push("pending audit sign-off remains");
  }
  if (rejectedCount > 0) {
    blockers.push("rejected audit sign-off remains");
  }
  const readyToArchive =
    options.handoffReady &&
    options.exportReady &&
    totalCount > 0 &&
    signedCount === totalCount &&
    pendingCount === 0 &&
    rejectedCount === 0;
  return {
    totalCount,
    signedCount,
    pendingCount,
    rejectedCount,
    handoffReady: options.handoffReady,
    exportReady: options.exportReady,
    readyToArchive,
    blockers
  };
}
