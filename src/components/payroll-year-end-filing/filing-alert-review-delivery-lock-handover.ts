import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type DeliveryPackageLockStatus = "draft" | "locked" | "released";
export type FinalHandoverStatus = "pending" | "handover_sent" | "acknowledged";
export type FinalHandoverChannel = "ops_note" | "hometax_bundle" | "internal_audit";

export type DeliveryPackageLockEntry = {
  packageId: string;
  status: DeliveryPackageLockStatus;
  lockedByRole: ReviewHandoffRole;
  lockedByActorId: string;
  lockReason: string;
  lockedAt: string | null;
  releaseNote: string;
};

export type FinalHandoverRecord = {
  targetRole: ReviewHandoffRole;
  targetActorId: string;
  status: FinalHandoverStatus;
  channel: FinalHandoverChannel;
  note: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
};

export type DeliveryLockHandoverSummary = {
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverSent: boolean;
  handoverAcknowledged: boolean;
  readyForCompletion: boolean;
  blockers: string[];
};

export function buildRoutingSignatureDeliveryLockRouteHref(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  value: number | null;
  ownerRole: string;
  ownerActorId: string;
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level,
    handoffReady: options.handoffReady ? "1" : "0",
    exportReady: options.exportReady ? "1" : "0",
    archiveReady: options.archiveReady ? "1" : "0",
    routingReady: options.routingReady ? "1" : "0",
    signatureReady: options.signatureReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock?${query.toString()}`;
}

export function buildDeliveryPackageLockEntry(input: {
  packageId: string;
  status: DeliveryPackageLockStatus;
  lockedByRole: ReviewHandoffRole;
  lockedByActorId: string;
  lockReason: string;
  releaseNote: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    packageId: input.packageId.trim() || `delivery-package-${now.toISOString()}`,
    status: input.status,
    lockedByRole: input.lockedByRole,
    lockedByActorId: input.lockedByActorId.trim(),
    lockReason: input.lockReason.trim(),
    lockedAt: input.status === "locked" ? now.toISOString() : null,
    releaseNote: input.releaseNote.trim()
  } satisfies DeliveryPackageLockEntry;
}

export function applyDeliveryPackageLock(options: {
  current: DeliveryPackageLockEntry;
  status: DeliveryPackageLockStatus;
  lockedByRole: ReviewHandoffRole;
  lockedByActorId: string;
  lockReason: string;
  releaseNote: string;
  now?: Date;
}) {
  return buildDeliveryPackageLockEntry({
    packageId: options.current.packageId,
    status: options.status,
    lockedByRole: options.lockedByRole,
    lockedByActorId: options.lockedByActorId,
    lockReason: options.lockReason,
    releaseNote: options.releaseNote,
    now: options.now
  });
}

export function buildFinalHandoverRecord(input: {
  targetRole: ReviewHandoffRole;
  targetActorId: string;
  status: FinalHandoverStatus;
  channel: FinalHandoverChannel;
  note: string;
  sentAt?: string | null;
  acknowledgedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const sentAt =
    input.status === "handover_sent" || input.status === "acknowledged"
      ? input.sentAt?.trim() || timestamp
      : null;
  const acknowledgedAt =
    input.status === "acknowledged" ? input.acknowledgedAt?.trim() || timestamp : null;
  return {
    targetRole: input.targetRole,
    targetActorId: input.targetActorId.trim(),
    status: input.status,
    channel: input.channel,
    note: input.note.trim(),
    sentAt,
    acknowledgedAt
  } satisfies FinalHandoverRecord;
}

export function applyFinalHandoverStatus(options: {
  current: FinalHandoverRecord;
  status: FinalHandoverStatus;
  targetRole: ReviewHandoffRole;
  targetActorId: string;
  channel: FinalHandoverChannel;
  note: string;
  now?: Date;
}) {
  return buildFinalHandoverRecord({
    targetRole: options.targetRole,
    targetActorId: options.targetActorId,
    status: options.status,
    channel: options.channel,
    note: options.note,
    sentAt: options.current.sentAt,
    acknowledgedAt: options.current.acknowledgedAt,
    now: options.now
  });
}

export function summarizeDeliveryLockHandover(options: {
  lockEntry: DeliveryPackageLockEntry;
  handoverRecord: FinalHandoverRecord;
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
}): DeliveryLockHandoverSummary {
  const packageLocked = options.lockEntry.status === "locked";
  const handoverSent =
    options.handoverRecord.status === "handover_sent" ||
    options.handoverRecord.status === "acknowledged";
  const handoverAcknowledged = options.handoverRecord.status === "acknowledged";

  const blockers: string[] = [];
  if (!options.handoffReady) {
    blockers.push("handoff snapshot is not ready");
  }
  if (!options.exportReady) {
    blockers.push("export snapshot is not ready");
  }
  if (!options.archiveReady) {
    blockers.push("archive package is not ready");
  }
  if (!options.routingReady) {
    blockers.push("approval routing bundle is not ready");
  }
  if (!options.signatureReady) {
    blockers.push("delivery signature bundle is not ready");
  }
  if (!packageLocked) {
    blockers.push("delivery package is not locked");
  }
  if (!handoverSent) {
    blockers.push("final handover has not been sent");
  }
  if (!handoverAcknowledged) {
    blockers.push("final handover has not been acknowledged");
  }

  return {
    handoffReady: options.handoffReady,
    exportReady: options.exportReady,
    archiveReady: options.archiveReady,
    routingReady: options.routingReady,
    signatureReady: options.signatureReady,
    packageLocked,
    handoverSent,
    handoverAcknowledged,
    readyForCompletion:
      options.handoffReady &&
      options.exportReady &&
      options.archiveReady &&
      options.routingReady &&
      options.signatureReady &&
      packageLocked &&
      handoverAcknowledged,
    blockers
  };
}
