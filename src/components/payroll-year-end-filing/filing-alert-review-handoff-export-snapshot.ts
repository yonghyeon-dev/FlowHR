import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";

export type ReviewHandoffRole = "payroll_operator" | "manager" | "admin";

export type FilingExportSnapshotFormat = "json" | "csv" | "jsonl" | "hometax_csv";
export type FilingExportSnapshotValidationStatus = "pass" | "fail";

export type ReviewHandoffPacket = {
  handoffId: string;
  fromRole: ReviewHandoffRole;
  fromActorId: string;
  toRole: ReviewHandoffRole;
  toActorId: string;
  note: string;
  escalationPath: string;
  dueAt: string;
  at: string;
};

export type FilingExportSnapshot = {
  artifactId: string;
  format: FilingExportSnapshotFormat;
  validationStatus: FilingExportSnapshotValidationStatus;
  recordCount: number;
  checksum: string;
  exportedAt: string;
};

export type ReviewHandoffExportSnapshotSummary = {
  approvalsReady: boolean;
  handoffReady: boolean;
  exportReady: boolean;
  readyToClose: boolean;
  reasons: string[];
};

export function parseReviewHandoffRole(value: string | null): ReviewHandoffRole {
  const normalized = (value ?? "").trim();
  if (normalized === "payroll_operator" || normalized === "manager" || normalized === "admin") {
    return normalized;
  }
  return "manager";
}

export function buildReviewSnapshotHandoffRouteHref(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  value: number | null;
  ownerRole: string;
  ownerActorId: string;
  approvedCount: number;
  pendingCount: number;
  reworkCount: number;
  totalCount: number;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level
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
  if (options.totalCount > 0) {
    query.set("totalCount", String(options.totalCount));
    query.set("approvedCount", String(Math.max(0, options.approvedCount)));
    query.set("pendingCount", String(Math.max(0, options.pendingCount)));
    query.set("reworkCount", String(Math.max(0, options.reworkCount)));
  }
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff?${query.toString()}`;
}

export function buildReviewHandoffPacket(input: {
  fromRole: ReviewHandoffRole;
  fromActorId: string;
  toRole: ReviewHandoffRole;
  toActorId: string;
  note: string;
  escalationPath: string;
  dueAt: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const at = now.toISOString();
  const fromRole = input.fromRole;
  const toRole = input.toRole;
  const fromActorId = input.fromActorId.trim() || "HANDOFF-FROM-UNKNOWN";
  const toActorId = input.toActorId.trim();
  const note = input.note.trim();
  const escalationPath = input.escalationPath.trim();
  const dueAt = input.dueAt.trim() || at;
  return {
    handoffId: `handoff:${fromRole}:${toRole}:${at}`,
    fromRole,
    fromActorId,
    toRole,
    toActorId,
    note,
    escalationPath,
    dueAt,
    at
  } satisfies ReviewHandoffPacket;
}

export function buildFilingExportSnapshot(input: {
  format: FilingExportSnapshotFormat;
  validationStatus: FilingExportSnapshotValidationStatus;
  recordCount: number;
  checksum: string;
  artifactId: string;
  exportedAt: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const fallbackTime = now.toISOString();
  const recordCount = Number.isFinite(input.recordCount) ? Math.max(0, Math.trunc(input.recordCount)) : 0;
  const checksum = input.checksum.trim();
  const artifactId = input.artifactId.trim() || `artifact-${fallbackTime}`;
  const exportedAt = input.exportedAt.trim() || fallbackTime;
  return {
    artifactId,
    format: input.format,
    validationStatus: input.validationStatus,
    recordCount,
    checksum,
    exportedAt
  } satisfies FilingExportSnapshot;
}

export function summarizeReviewHandoffExportSnapshot(options: {
  approvedCount: number;
  pendingCount: number;
  reworkCount: number;
  totalCount: number;
  handoffPacket: ReviewHandoffPacket | null;
  exportSnapshot: FilingExportSnapshot | null;
}): ReviewHandoffExportSnapshotSummary {
  const reasons: string[] = [];

  const approvalsReady =
    options.totalCount > 0 &&
    options.approvedCount === options.totalCount &&
    options.pendingCount === 0 &&
    options.reworkCount === 0;
  if (!approvalsReady) {
    reasons.push("review approvals are not fully approved");
  }

  const handoffReady =
    options.handoffPacket !== null &&
    options.handoffPacket.note.length > 0 &&
    options.handoffPacket.toActorId.length > 0;
  if (!handoffReady) {
    reasons.push("handoff packet is missing recipient or note");
  }

  const exportReady =
    options.exportSnapshot !== null &&
    options.exportSnapshot.validationStatus === "pass" &&
    options.exportSnapshot.recordCount > 0 &&
    options.exportSnapshot.checksum.length > 0;
  if (!exportReady) {
    reasons.push("export snapshot is incomplete or validation failed");
  }

  return {
    approvalsReady,
    handoffReady,
    exportReady,
    readyToClose: approvalsReady && handoffReady && exportReady,
    reasons
  };
}
