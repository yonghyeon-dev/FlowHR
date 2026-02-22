import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestStatus = "pending" | "compiled" | "published";
export type ClosurePacketReleaseDigestChannel =
  | "ops_digest_board"
  | "finance_digest_board"
  | "audit_digest_board";
export type ClosurePacketReleaseDigestChannelStatus = "pending" | "queued" | "delivered";

export type ClosurePacketReleaseDigestRecord = {
  digestId: string;
  status: ClosurePacketReleaseDigestStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  compiledAt: string | null;
  publishedAt: string | null;
};

export type ClosurePacketReleaseDigestChannelEntry = {
  channel: ClosurePacketReleaseDigestChannel;
  status: ClosurePacketReleaseDigestChannelStatus;
  artifactId: string;
  referenceId: string;
  note: string;
  queuedAt: string | null;
  deliveredAt: string | null;
};

export type ClosurePacketReleaseDigestSummary = {
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
  receiptVerified: boolean;
  digestReady: boolean;
  closeReportPublished: boolean;
  publicationReady: boolean;
  distributionReady: boolean;
  signoffReady: boolean;
  closurePacketSealed: boolean;
  dispatchReady: boolean;
  releaseDigestPublished: boolean;
  releaseDigestQueuedCount: number;
  releaseDigestDeliveredCount: number;
  releaseDigestTotalCount: number;
  releaseDigestDeliveryReady: boolean;
  readyForReleaseDigest: boolean;
  blockers: string[];
};

export function buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref(options: {
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
  receiptVerified: boolean;
  digestReady: boolean;
  closeReportPublished: boolean;
  publicationReady: boolean;
  distributionReady: boolean;
  signoffReady: boolean;
  closurePacketSealed: boolean;
  dispatchReady: boolean;
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
    handoverAcknowledged: options.handoverAcknowledged ? "1" : "0",
    receiptVerified: options.receiptVerified ? "1" : "0",
    digestReady: options.digestReady ? "1" : "0",
    closeReportPublished: options.closeReportPublished ? "1" : "0",
    publicationReady: options.publicationReady ? "1" : "0",
    distributionReady: options.distributionReady ? "1" : "0",
    signoffReady: options.signoffReady ? "1" : "0",
    closurePacketSealed: options.closurePacketSealed ? "1" : "0",
    dispatchReady: options.dispatchReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest?${query.toString()}`;
}

export function buildClosurePacketReleaseDigestRecord(input: {
  digestId: string;
  status: ClosurePacketReleaseDigestStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  compiledAt?: string | null;
  publishedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const compiledAt =
    input.status === "compiled" || input.status === "published"
      ? input.compiledAt?.trim() || timestamp
      : null;
  const publishedAt = input.status === "published" ? input.publishedAt?.trim() || timestamp : null;

  return {
    digestId: input.digestId.trim() || `release-digest-${timestamp}`,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    summary: input.summary.trim(),
    compiledAt,
    publishedAt
  } satisfies ClosurePacketReleaseDigestRecord;
}

export function applyClosurePacketReleaseDigest(options: {
  current: ClosurePacketReleaseDigestRecord;
  status: ClosurePacketReleaseDigestStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  now?: Date;
}) {
  return buildClosurePacketReleaseDigestRecord({
    digestId: options.current.digestId,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    summary: options.summary,
    compiledAt: options.current.compiledAt,
    publishedAt: options.current.publishedAt,
    now: options.now
  });
}

export function buildDefaultClosurePacketReleaseDigestChannelEntries() {
  return [
    {
      channel: "ops_digest_board",
      status: "pending",
      artifactId: "",
      referenceId: "",
      note: "",
      queuedAt: null,
      deliveredAt: null
    },
    {
      channel: "finance_digest_board",
      status: "pending",
      artifactId: "",
      referenceId: "",
      note: "",
      queuedAt: null,
      deliveredAt: null
    },
    {
      channel: "audit_digest_board",
      status: "pending",
      artifactId: "",
      referenceId: "",
      note: "",
      queuedAt: null,
      deliveredAt: null
    }
  ] satisfies ClosurePacketReleaseDigestChannelEntry[];
}

export function buildClosurePacketReleaseDigestChannelEntry(input: {
  channel: ClosurePacketReleaseDigestChannel;
  status: ClosurePacketReleaseDigestChannelStatus;
  artifactId: string;
  referenceId: string;
  note: string;
  queuedAt?: string | null;
  deliveredAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const queuedAt =
    input.status === "queued" || input.status === "delivered"
      ? input.queuedAt?.trim() || timestamp
      : null;
  const deliveredAt = input.status === "delivered" ? input.deliveredAt?.trim() || timestamp : null;
  return {
    channel: input.channel,
    status: input.status,
    artifactId: input.artifactId.trim(),
    referenceId: input.referenceId.trim(),
    note: input.note.trim(),
    queuedAt,
    deliveredAt
  } satisfies ClosurePacketReleaseDigestChannelEntry;
}

export function applyClosurePacketReleaseDigestChannelStatus(options: {
  entries: readonly ClosurePacketReleaseDigestChannelEntry[];
  channel: ClosurePacketReleaseDigestChannel;
  status: ClosurePacketReleaseDigestChannelStatus;
  artifactId: string;
  referenceId: string;
  note: string;
  now?: Date;
}) {
  const current = options.entries.find((entry) => entry.channel === options.channel);
  const next = buildClosurePacketReleaseDigestChannelEntry({
    channel: options.channel,
    status: options.status,
    artifactId: options.artifactId,
    referenceId: options.referenceId,
    note: options.note,
    queuedAt: current?.queuedAt,
    deliveredAt: current?.deliveredAt,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeClosurePacketReleaseDigest(options: {
  releaseDigestRecord: ClosurePacketReleaseDigestRecord;
  releaseDigestChannelEntries: readonly ClosurePacketReleaseDigestChannelEntry[];
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
  receiptVerified: boolean;
  digestReady: boolean;
  closeReportPublished: boolean;
  publicationReady: boolean;
  distributionReady: boolean;
  signoffReady: boolean;
  closurePacketSealed: boolean;
  dispatchReady: boolean;
}): ClosurePacketReleaseDigestSummary {
  const releaseDigestTotalCount = options.releaseDigestChannelEntries.length;
  const releaseDigestQueuedCount = options.releaseDigestChannelEntries.filter(
    (entry) => entry.status === "queued"
  ).length;
  const releaseDigestDeliveredCount = options.releaseDigestChannelEntries.filter(
    (entry) => entry.status === "delivered"
  ).length;
  const releaseDigestPendingCount = options.releaseDigestChannelEntries.filter(
    (entry) => entry.status === "pending"
  ).length;
  const releaseDigestDeliveryReady =
    releaseDigestTotalCount > 0 &&
    releaseDigestDeliveredCount === releaseDigestTotalCount &&
    releaseDigestQueuedCount === 0 &&
    releaseDigestPendingCount === 0;

  const releaseDigestPublished = options.releaseDigestRecord.status === "published";

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
  if (!options.receiptVerified) {
    blockers.push("completion receipt has not been verified");
  }
  if (!options.digestReady) {
    blockers.push("archive digest is not fully sealed");
  }
  if (!options.closeReportPublished) {
    blockers.push("completion close report is not published");
  }
  if (!options.publicationReady) {
    blockers.push("close report publication is not complete");
  }
  if (!options.distributionReady) {
    blockers.push("distribution channels are not fully confirmed");
  }
  if (!options.signoffReady) {
    blockers.push("distribution sign-off is not complete");
  }
  if (!options.closurePacketSealed) {
    blockers.push("closure packet is not sealed");
  }
  if (!options.dispatchReady) {
    blockers.push("closure packet dispatch is not fully released");
  }
  if (!releaseDigestPublished) {
    blockers.push("closure packet release digest is not published");
  }
  if (!releaseDigestDeliveryReady) {
    blockers.push("release digest channels are not fully delivered");
  }

  return {
    handoffReady: options.handoffReady,
    exportReady: options.exportReady,
    archiveReady: options.archiveReady,
    routingReady: options.routingReady,
    signatureReady: options.signatureReady,
    packageLocked: options.packageLocked,
    handoverAcknowledged: options.handoverAcknowledged,
    receiptVerified: options.receiptVerified,
    digestReady: options.digestReady,
    closeReportPublished: options.closeReportPublished,
    publicationReady: options.publicationReady,
    distributionReady: options.distributionReady,
    signoffReady: options.signoffReady,
    closurePacketSealed: options.closurePacketSealed,
    dispatchReady: options.dispatchReady,
    releaseDigestPublished,
    releaseDigestQueuedCount,
    releaseDigestDeliveredCount,
    releaseDigestTotalCount,
    releaseDigestDeliveryReady,
    readyForReleaseDigest:
      options.handoffReady &&
      options.exportReady &&
      options.archiveReady &&
      options.routingReady &&
      options.signatureReady &&
      options.packageLocked &&
      options.handoverAcknowledged &&
      options.receiptVerified &&
      options.digestReady &&
      options.closeReportPublished &&
      options.publicationReady &&
      options.distributionReady &&
      options.signoffReady &&
      options.closurePacketSealed &&
      options.dispatchReady &&
      releaseDigestPublished &&
      releaseDigestDeliveryReady,
    blockers
  };
}
