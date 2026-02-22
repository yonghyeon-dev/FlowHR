import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type CompletionReceiptStatus = "pending" | "issued" | "verified";
export type ArchiveDigestChannel = "hometax_bundle" | "internal_archive" | "ops_receipt";
export type ArchiveDigestStatus = "pending" | "prepared" | "sealed";

export type CompletionReceiptRecord = {
  receiptId: string;
  status: CompletionReceiptStatus;
  issuedByRole: ReviewHandoffRole;
  issuedByActorId: string;
  note: string;
  issuedAt: string | null;
  verifiedAt: string | null;
};

export type ArchiveDigestEntry = {
  channel: ArchiveDigestChannel;
  status: ArchiveDigestStatus;
  artifactId: string;
  checksum: string;
  note: string;
  updatedAt: string | null;
};

export type CompletionArchiveDigestSummary = {
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
  receiptIssued: boolean;
  receiptVerified: boolean;
  digestPreparedCount: number;
  digestSealedCount: number;
  digestTotalCount: number;
  digestReady: boolean;
  readyForArchiveDigest: boolean;
  blockers: string[];
};

export function buildDeliveryLockCompletionReceiptRouteHref(options: {
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
  packageLocked: boolean;
  handoverAcknowledged: boolean;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level,
    handoffReady: options.handoffReady ? "1" : "0",
    exportReady: options.exportReady ? "1" : "0",
    archiveReady: options.archiveReady ? "1" : "0",
    routingReady: options.routingReady ? "1" : "0",
    signatureReady: options.signatureReady ? "1" : "0",
    packageLocked: options.packageLocked ? "1" : "0",
    handoverAcknowledged: options.handoverAcknowledged ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt?${query.toString()}`;
}

export function buildCompletionReceiptRecord(input: {
  receiptId: string;
  status: CompletionReceiptStatus;
  issuedByRole: ReviewHandoffRole;
  issuedByActorId: string;
  note: string;
  issuedAt?: string | null;
  verifiedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const issuedAt =
    input.status === "issued" || input.status === "verified"
      ? input.issuedAt?.trim() || timestamp
      : null;
  const verifiedAt = input.status === "verified" ? input.verifiedAt?.trim() || timestamp : null;

  return {
    receiptId: input.receiptId.trim() || `receipt-${timestamp}`,
    status: input.status,
    issuedByRole: input.issuedByRole,
    issuedByActorId: input.issuedByActorId.trim(),
    note: input.note.trim(),
    issuedAt,
    verifiedAt
  } satisfies CompletionReceiptRecord;
}

export function applyCompletionReceipt(options: {
  current: CompletionReceiptRecord;
  status: CompletionReceiptStatus;
  issuedByRole: ReviewHandoffRole;
  issuedByActorId: string;
  note: string;
  now?: Date;
}) {
  return buildCompletionReceiptRecord({
    receiptId: options.current.receiptId,
    status: options.status,
    issuedByRole: options.issuedByRole,
    issuedByActorId: options.issuedByActorId,
    note: options.note,
    issuedAt: options.current.issuedAt,
    verifiedAt: options.current.verifiedAt,
    now: options.now
  });
}

export function buildDefaultArchiveDigestEntries() {
  return [
    {
      channel: "hometax_bundle",
      status: "pending",
      artifactId: "",
      checksum: "",
      note: "",
      updatedAt: null
    },
    {
      channel: "internal_archive",
      status: "pending",
      artifactId: "",
      checksum: "",
      note: "",
      updatedAt: null
    },
    {
      channel: "ops_receipt",
      status: "pending",
      artifactId: "",
      checksum: "",
      note: "",
      updatedAt: null
    }
  ] satisfies ArchiveDigestEntry[];
}

export function buildArchiveDigestEntry(input: {
  channel: ArchiveDigestChannel;
  status: ArchiveDigestStatus;
  artifactId: string;
  checksum: string;
  note: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    channel: input.channel,
    status: input.status,
    artifactId: input.artifactId.trim(),
    checksum: input.checksum.trim(),
    note: input.note.trim(),
    updatedAt: input.status === "pending" ? null : now.toISOString()
  } satisfies ArchiveDigestEntry;
}

export function applyArchiveDigestStatus(options: {
  entries: readonly ArchiveDigestEntry[];
  channel: ArchiveDigestChannel;
  status: ArchiveDigestStatus;
  artifactId: string;
  checksum: string;
  note: string;
  now?: Date;
}) {
  const next = buildArchiveDigestEntry({
    channel: options.channel,
    status: options.status,
    artifactId: options.artifactId,
    checksum: options.checksum,
    note: options.note,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeCompletionReceiptArchiveDigest(options: {
  receiptRecord: CompletionReceiptRecord;
  digestEntries: readonly ArchiveDigestEntry[];
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
}): CompletionArchiveDigestSummary {
  const digestTotalCount = options.digestEntries.length;
  const digestPreparedCount = options.digestEntries.filter((entry) => entry.status === "prepared").length;
  const digestSealedCount = options.digestEntries.filter((entry) => entry.status === "sealed").length;
  const digestPendingCount = options.digestEntries.filter((entry) => entry.status === "pending").length;
  const digestReady =
    digestTotalCount > 0 && digestSealedCount === digestTotalCount && digestPendingCount === 0;

  const receiptIssued =
    options.receiptRecord.status === "issued" || options.receiptRecord.status === "verified";
  const receiptVerified = options.receiptRecord.status === "verified";

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
  if (!options.packageLocked) {
    blockers.push("delivery package is not locked");
  }
  if (!options.handoverAcknowledged) {
    blockers.push("final handover is not acknowledged");
  }
  if (!receiptIssued) {
    blockers.push("completion receipt has not been issued");
  }
  if (!receiptVerified) {
    blockers.push("completion receipt has not been verified");
  }
  if (!digestReady) {
    blockers.push("archive digest channels are not fully sealed");
  }

  return {
    handoffReady: options.handoffReady,
    exportReady: options.exportReady,
    archiveReady: options.archiveReady,
    routingReady: options.routingReady,
    signatureReady: options.signatureReady,
    packageLocked: options.packageLocked,
    handoverAcknowledged: options.handoverAcknowledged,
    receiptIssued,
    receiptVerified,
    digestPreparedCount,
    digestSealedCount,
    digestTotalCount,
    digestReady,
    readyForArchiveDigest:
      options.handoffReady &&
      options.exportReady &&
      options.archiveReady &&
      options.routingReady &&
      options.signatureReady &&
      options.packageLocked &&
      options.handoverAcknowledged &&
      receiptVerified &&
      digestReady,
    blockers
  };
}
