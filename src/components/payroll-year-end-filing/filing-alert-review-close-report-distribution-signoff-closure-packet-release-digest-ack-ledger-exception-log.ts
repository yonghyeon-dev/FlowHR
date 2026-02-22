import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestAckLedgerExceptionLogStatus = "pending" | "recorded" | "closed";
export type ClosurePacketReleaseDigestAckLedgerExceptionCategory =
  | "ops_exception_desk"
  | "finance_exception_desk"
  | "audit_exception_desk";
export type ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus =
  | "open"
  | "investigating"
  | "resolved";

export type ClosurePacketReleaseDigestAckLedgerExceptionLogRecord = {
  logId: string;
  status: ClosurePacketReleaseDigestAckLedgerExceptionLogStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  recordedAt: string | null;
  closedAt: string | null;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionEntry = {
  category: ClosurePacketReleaseDigestAckLedgerExceptionCategory;
  status: ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus;
  incidentId: string;
  referenceId: string;
  note: string;
  openedAt: string | null;
  resolvedAt: string | null;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionLogSummary = {
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
  ackChannelsReconciled: boolean;
  exceptionLogClosed: boolean;
  exceptionOpenCount: number;
  exceptionInvestigatingCount: number;
  exceptionResolvedCount: number;
  exceptionTotalCount: number;
  allExceptionsResolved: boolean;
  readyForExceptionClosure: boolean;
  blockers: string[];
};

export function buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref(options: {
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
  ackLedgerVerified: boolean;
  ackChannelsReconciled: boolean;
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
    releaseDigestDeliveryReady: options.releaseDigestDeliveryReady ? "1" : "0",
    ackLedgerVerified: options.ackLedgerVerified ? "1" : "0",
    ackChannelsReconciled: options.ackChannelsReconciled ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger/exception-log?${query.toString()}`;
}

export function buildClosurePacketReleaseDigestAckLedgerExceptionLogRecord(input: {
  logId: string;
  status: ClosurePacketReleaseDigestAckLedgerExceptionLogStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  recordedAt?: string | null;
  closedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const recordedAt =
    input.status === "recorded" || input.status === "closed"
      ? input.recordedAt?.trim() || timestamp
      : null;
  const closedAt = input.status === "closed" ? input.closedAt?.trim() || timestamp : null;

  return {
    logId: input.logId.trim() || `exception-log-${timestamp}`,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    summary: input.summary.trim(),
    recordedAt,
    closedAt
  } satisfies ClosurePacketReleaseDigestAckLedgerExceptionLogRecord;
}

export function applyClosurePacketReleaseDigestAckLedgerExceptionLog(options: {
  current: ClosurePacketReleaseDigestAckLedgerExceptionLogRecord;
  status: ClosurePacketReleaseDigestAckLedgerExceptionLogStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  now?: Date;
}) {
  return buildClosurePacketReleaseDigestAckLedgerExceptionLogRecord({
    logId: options.current.logId,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    summary: options.summary,
    recordedAt: options.current.recordedAt,
    closedAt: options.current.closedAt,
    now: options.now
  });
}

export function buildDefaultClosurePacketReleaseDigestAckLedgerExceptionEntries() {
  return [
    {
      category: "ops_exception_desk",
      status: "open",
      incidentId: "",
      referenceId: "",
      note: "",
      openedAt: null,
      resolvedAt: null
    },
    {
      category: "finance_exception_desk",
      status: "open",
      incidentId: "",
      referenceId: "",
      note: "",
      openedAt: null,
      resolvedAt: null
    },
    {
      category: "audit_exception_desk",
      status: "open",
      incidentId: "",
      referenceId: "",
      note: "",
      openedAt: null,
      resolvedAt: null
    }
  ] satisfies ClosurePacketReleaseDigestAckLedgerExceptionEntry[];
}

export function buildClosurePacketReleaseDigestAckLedgerExceptionEntry(input: {
  category: ClosurePacketReleaseDigestAckLedgerExceptionCategory;
  status: ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus;
  incidentId: string;
  referenceId: string;
  note: string;
  openedAt?: string | null;
  resolvedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const openedAt =
    input.status === "open" || input.status === "investigating" || input.status === "resolved"
      ? input.openedAt?.trim() || timestamp
      : null;
  const resolvedAt = input.status === "resolved" ? input.resolvedAt?.trim() || timestamp : null;

  return {
    category: input.category,
    status: input.status,
    incidentId: input.incidentId.trim(),
    referenceId: input.referenceId.trim(),
    note: input.note.trim(),
    openedAt,
    resolvedAt
  } satisfies ClosurePacketReleaseDigestAckLedgerExceptionEntry;
}

export function applyClosurePacketReleaseDigestAckLedgerExceptionEntryStatus(options: {
  entries: readonly ClosurePacketReleaseDigestAckLedgerExceptionEntry[];
  category: ClosurePacketReleaseDigestAckLedgerExceptionCategory;
  status: ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus;
  incidentId: string;
  referenceId: string;
  note: string;
  now?: Date;
}) {
  const current = options.entries.find((entry) => entry.category === options.category);
  const next = buildClosurePacketReleaseDigestAckLedgerExceptionEntry({
    category: options.category,
    status: options.status,
    incidentId: options.incidentId,
    referenceId: options.referenceId,
    note: options.note,
    openedAt: current?.openedAt,
    resolvedAt: current?.resolvedAt,
    now: options.now
  });
  return options.entries.map((entry) => (entry.category === options.category ? next : entry));
}

export function summarizeClosurePacketReleaseDigestAckLedgerExceptionLog(options: {
  exceptionLogRecord: ClosurePacketReleaseDigestAckLedgerExceptionLogRecord;
  exceptionEntries: readonly ClosurePacketReleaseDigestAckLedgerExceptionEntry[];
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
  ackChannelsReconciled: boolean;
}): ClosurePacketReleaseDigestAckLedgerExceptionLogSummary {
  const exceptionTotalCount = options.exceptionEntries.length;
  const exceptionOpenCount = options.exceptionEntries.filter((entry) => entry.status === "open").length;
  const exceptionInvestigatingCount = options.exceptionEntries.filter(
    (entry) => entry.status === "investigating"
  ).length;
  const exceptionResolvedCount = options.exceptionEntries.filter((entry) => entry.status === "resolved").length;
  const allExceptionsResolved =
    exceptionTotalCount > 0 &&
    exceptionResolvedCount === exceptionTotalCount &&
    exceptionOpenCount === 0 &&
    exceptionInvestigatingCount === 0;
  const exceptionLogClosed = options.exceptionLogRecord.status === "closed";

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
  if (!options.ackLedgerVerified) {
    blockers.push("release digest acknowledgment ledger is not verified");
  }
  if (!options.ackChannelsReconciled) {
    blockers.push("acknowledgment channels are not fully reconciled");
  }
  if (!exceptionLogClosed) {
    blockers.push("acknowledgment exception log is not closed");
  }
  if (!allExceptionsResolved) {
    blockers.push("exception categories are not fully resolved");
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
    ackLedgerVerified: options.ackLedgerVerified,
    ackChannelsReconciled: options.ackChannelsReconciled,
    exceptionLogClosed,
    exceptionOpenCount,
    exceptionInvestigatingCount,
    exceptionResolvedCount,
    exceptionTotalCount,
    allExceptionsResolved,
    readyForExceptionClosure:
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
      options.ackLedgerVerified &&
      options.ackChannelsReconciled &&
      exceptionLogClosed &&
      allExceptionsResolved,
    blockers
  };
}
