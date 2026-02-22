import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketStatus = "pending" | "assembled" | "sealed";
export type ClosurePacketDispatchChannel =
  | "ops_archive_room"
  | "finance_archive_room"
  | "compliance_vault";
export type ClosurePacketDispatchStatus = "pending" | "prepared" | "released";

export type CloseReportDistributionSignoffClosurePacketRecord = {
  packetId: string;
  status: ClosurePacketStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  assembledAt: string | null;
  sealedAt: string | null;
};

export type ClosurePacketDispatchEntry = {
  channel: ClosurePacketDispatchChannel;
  status: ClosurePacketDispatchStatus;
  artifactId: string;
  checksum: string;
  note: string;
  preparedAt: string | null;
  releasedAt: string | null;
};

export type CloseReportDistributionSignoffClosurePacketSummary = {
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
  dispatchReleasedCount: number;
  dispatchPreparedCount: number;
  dispatchTotalCount: number;
  dispatchReady: boolean;
  readyForClosurePacket: boolean;
  blockers: string[];
};

export function buildCloseReportDistributionSignoffClosurePacketRouteHref(options: {
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
    signoffReady: options.signoffReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet?${query.toString()}`;
}

export function buildClosurePacketRecord(input: {
  packetId: string;
  status: ClosurePacketStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  assembledAt?: string | null;
  sealedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const assembledAt =
    input.status === "assembled" || input.status === "sealed"
      ? input.assembledAt?.trim() || timestamp
      : null;
  const sealedAt = input.status === "sealed" ? input.sealedAt?.trim() || timestamp : null;

  return {
    packetId: input.packetId.trim() || `closure-packet-${timestamp}`,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    summary: input.summary.trim(),
    assembledAt,
    sealedAt
  } satisfies CloseReportDistributionSignoffClosurePacketRecord;
}

export function applyClosurePacket(options: {
  current: CloseReportDistributionSignoffClosurePacketRecord;
  status: ClosurePacketStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  now?: Date;
}) {
  return buildClosurePacketRecord({
    packetId: options.current.packetId,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    summary: options.summary,
    assembledAt: options.current.assembledAt,
    sealedAt: options.current.sealedAt,
    now: options.now
  });
}

export function buildDefaultClosurePacketDispatchEntries() {
  return [
    {
      channel: "ops_archive_room",
      status: "pending",
      artifactId: "",
      checksum: "",
      note: "",
      preparedAt: null,
      releasedAt: null
    },
    {
      channel: "finance_archive_room",
      status: "pending",
      artifactId: "",
      checksum: "",
      note: "",
      preparedAt: null,
      releasedAt: null
    },
    {
      channel: "compliance_vault",
      status: "pending",
      artifactId: "",
      checksum: "",
      note: "",
      preparedAt: null,
      releasedAt: null
    }
  ] satisfies ClosurePacketDispatchEntry[];
}

export function buildClosurePacketDispatchEntry(input: {
  channel: ClosurePacketDispatchChannel;
  status: ClosurePacketDispatchStatus;
  artifactId: string;
  checksum: string;
  note: string;
  preparedAt?: string | null;
  releasedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const preparedAt =
    input.status === "prepared" || input.status === "released"
      ? input.preparedAt?.trim() || timestamp
      : null;
  const releasedAt = input.status === "released" ? input.releasedAt?.trim() || timestamp : null;
  return {
    channel: input.channel,
    status: input.status,
    artifactId: input.artifactId.trim(),
    checksum: input.checksum.trim(),
    note: input.note.trim(),
    preparedAt,
    releasedAt
  } satisfies ClosurePacketDispatchEntry;
}

export function applyClosurePacketDispatchStatus(options: {
  entries: readonly ClosurePacketDispatchEntry[];
  channel: ClosurePacketDispatchChannel;
  status: ClosurePacketDispatchStatus;
  artifactId: string;
  checksum: string;
  note: string;
  now?: Date;
}) {
  const current = options.entries.find((entry) => entry.channel === options.channel);
  const next = buildClosurePacketDispatchEntry({
    channel: options.channel,
    status: options.status,
    artifactId: options.artifactId,
    checksum: options.checksum,
    note: options.note,
    preparedAt: current?.preparedAt,
    releasedAt: current?.releasedAt,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeCloseReportDistributionSignoffClosurePacket(options: {
  closurePacketRecord: CloseReportDistributionSignoffClosurePacketRecord;
  dispatchEntries: readonly ClosurePacketDispatchEntry[];
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
}): CloseReportDistributionSignoffClosurePacketSummary {
  const dispatchTotalCount = options.dispatchEntries.length;
  const dispatchReleasedCount = options.dispatchEntries.filter((entry) => entry.status === "released").length;
  const dispatchPreparedCount = options.dispatchEntries.filter((entry) => entry.status === "prepared").length;
  const dispatchPendingCount = options.dispatchEntries.filter((entry) => entry.status === "pending").length;
  const dispatchReady =
    dispatchTotalCount > 0 &&
    dispatchReleasedCount === dispatchTotalCount &&
    dispatchPreparedCount === 0 &&
    dispatchPendingCount === 0;

  const closurePacketSealed = options.closurePacketRecord.status === "sealed";

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
  if (!closurePacketSealed) {
    blockers.push("closure packet is not sealed");
  }
  if (!dispatchReady) {
    blockers.push("closure packet dispatch is not fully released");
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
    closurePacketSealed,
    dispatchReleasedCount,
    dispatchPreparedCount,
    dispatchTotalCount,
    dispatchReady,
    readyForClosurePacket:
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
      closurePacketSealed &&
      dispatchReady,
    blockers
  };
}
