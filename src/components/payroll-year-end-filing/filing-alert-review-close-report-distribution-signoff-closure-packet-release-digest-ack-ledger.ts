import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestAckLedgerStatus = "pending" | "logged" | "verified";
export type ClosurePacketReleaseDigestAckChannel =
  | "ops_ack_desk"
  | "finance_ack_desk"
  | "audit_ack_desk";
export type ClosurePacketReleaseDigestAckChannelStatus = "pending" | "acknowledged" | "reconciled";

export type ClosurePacketReleaseDigestAckLedgerRecord = {
  ledgerId: string;
  status: ClosurePacketReleaseDigestAckLedgerStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
  loggedAt: string | null;
  verifiedAt: string | null;
};

export type ClosurePacketReleaseDigestAckChannelEntry = {
  channel: ClosurePacketReleaseDigestAckChannel;
  status: ClosurePacketReleaseDigestAckChannelStatus;
  ackCode: string;
  referenceId: string;
  note: string;
  acknowledgedAt: string | null;
  reconciledAt: string | null;
};

export type ClosurePacketReleaseDigestAckLedgerSummary = {
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
  releaseDigestDeliveryReady: boolean;
  ackLedgerVerified: boolean;
  ackChannelAcknowledgedCount: number;
  ackChannelReconciledCount: number;
  ackChannelTotalCount: number;
  ackChannelsReconciled: boolean;
  readyForAckLedger: boolean;
  blockers: string[];
};

export function buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref(options: {
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
  releaseDigestPublished: boolean;
  releaseDigestDeliveryReady: boolean;
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
    dispatchReady: options.dispatchReady ? "1" : "0",
    releaseDigestPublished: options.releaseDigestPublished ? "1" : "0",
    releaseDigestDeliveryReady: options.releaseDigestDeliveryReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger?${query.toString()}`;
}

export function buildClosurePacketReleaseDigestAckLedgerRecord(input: {
  ledgerId: string;
  status: ClosurePacketReleaseDigestAckLedgerStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
  loggedAt?: string | null;
  verifiedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const loggedAt =
    input.status === "logged" || input.status === "verified" ? input.loggedAt?.trim() || timestamp : null;
  const verifiedAt = input.status === "verified" ? input.verifiedAt?.trim() || timestamp : null;

  return {
    ledgerId: input.ledgerId.trim() || `ack-ledger-${timestamp}`,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    note: input.note.trim(),
    loggedAt,
    verifiedAt
  } satisfies ClosurePacketReleaseDigestAckLedgerRecord;
}

export function applyClosurePacketReleaseDigestAckLedger(options: {
  current: ClosurePacketReleaseDigestAckLedgerRecord;
  status: ClosurePacketReleaseDigestAckLedgerStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
  now?: Date;
}) {
  return buildClosurePacketReleaseDigestAckLedgerRecord({
    ledgerId: options.current.ledgerId,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    note: options.note,
    loggedAt: options.current.loggedAt,
    verifiedAt: options.current.verifiedAt,
    now: options.now
  });
}

export function buildDefaultClosurePacketReleaseDigestAckChannelEntries() {
  return [
    {
      channel: "ops_ack_desk",
      status: "pending",
      ackCode: "",
      referenceId: "",
      note: "",
      acknowledgedAt: null,
      reconciledAt: null
    },
    {
      channel: "finance_ack_desk",
      status: "pending",
      ackCode: "",
      referenceId: "",
      note: "",
      acknowledgedAt: null,
      reconciledAt: null
    },
    {
      channel: "audit_ack_desk",
      status: "pending",
      ackCode: "",
      referenceId: "",
      note: "",
      acknowledgedAt: null,
      reconciledAt: null
    }
  ] satisfies ClosurePacketReleaseDigestAckChannelEntry[];
}

export function buildClosurePacketReleaseDigestAckChannelEntry(input: {
  channel: ClosurePacketReleaseDigestAckChannel;
  status: ClosurePacketReleaseDigestAckChannelStatus;
  ackCode: string;
  referenceId: string;
  note: string;
  acknowledgedAt?: string | null;
  reconciledAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const acknowledgedAt =
    input.status === "acknowledged" || input.status === "reconciled"
      ? input.acknowledgedAt?.trim() || timestamp
      : null;
  const reconciledAt = input.status === "reconciled" ? input.reconciledAt?.trim() || timestamp : null;

  return {
    channel: input.channel,
    status: input.status,
    ackCode: input.ackCode.trim(),
    referenceId: input.referenceId.trim(),
    note: input.note.trim(),
    acknowledgedAt,
    reconciledAt
  } satisfies ClosurePacketReleaseDigestAckChannelEntry;
}

export function applyClosurePacketReleaseDigestAckChannelStatus(options: {
  entries: readonly ClosurePacketReleaseDigestAckChannelEntry[];
  channel: ClosurePacketReleaseDigestAckChannel;
  status: ClosurePacketReleaseDigestAckChannelStatus;
  ackCode: string;
  referenceId: string;
  note: string;
  now?: Date;
}) {
  const current = options.entries.find((entry) => entry.channel === options.channel);
  const next = buildClosurePacketReleaseDigestAckChannelEntry({
    channel: options.channel,
    status: options.status,
    ackCode: options.ackCode,
    referenceId: options.referenceId,
    note: options.note,
    acknowledgedAt: current?.acknowledgedAt,
    reconciledAt: current?.reconciledAt,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeClosurePacketReleaseDigestAckLedger(options: {
  ackLedgerRecord: ClosurePacketReleaseDigestAckLedgerRecord;
  ackChannelEntries: readonly ClosurePacketReleaseDigestAckChannelEntry[];
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
  releaseDigestDeliveryReady: boolean;
}): ClosurePacketReleaseDigestAckLedgerSummary {
  const ackChannelTotalCount = options.ackChannelEntries.length;
  const ackChannelAcknowledgedCount = options.ackChannelEntries.filter(
    (entry) => entry.status === "acknowledged"
  ).length;
  const ackChannelReconciledCount = options.ackChannelEntries.filter(
    (entry) => entry.status === "reconciled"
  ).length;
  const ackChannelPendingCount = options.ackChannelEntries.filter(
    (entry) => entry.status === "pending"
  ).length;

  const ackChannelsReconciled =
    ackChannelTotalCount > 0 &&
    ackChannelReconciledCount === ackChannelTotalCount &&
    ackChannelAcknowledgedCount === 0 &&
    ackChannelPendingCount === 0;
  const ackLedgerVerified = options.ackLedgerRecord.status === "verified";

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
  if (!options.releaseDigestPublished) {
    blockers.push("closure packet release digest is not published");
  }
  if (!options.releaseDigestDeliveryReady) {
    blockers.push("release digest channels are not fully delivered");
  }
  if (!ackLedgerVerified) {
    blockers.push("release digest acknowledgment ledger is not verified");
  }
  if (!ackChannelsReconciled) {
    blockers.push("acknowledgment channels are not fully reconciled");
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
    releaseDigestPublished: options.releaseDigestPublished,
    releaseDigestDeliveryReady: options.releaseDigestDeliveryReady,
    ackLedgerVerified,
    ackChannelAcknowledgedCount,
    ackChannelReconciledCount,
    ackChannelTotalCount,
    ackChannelsReconciled,
    readyForAckLedger:
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
      options.releaseDigestPublished &&
      options.releaseDigestDeliveryReady &&
      ackLedgerVerified &&
      ackChannelsReconciled,
    blockers
  };
}
