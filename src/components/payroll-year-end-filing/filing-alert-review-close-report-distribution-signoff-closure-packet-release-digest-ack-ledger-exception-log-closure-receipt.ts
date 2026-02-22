import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus =
  | "pending"
  | "issued"
  | "verified";
export type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel =
  | "ops_exception_closure_desk"
  | "finance_exception_closure_desk"
  | "audit_exception_closure_desk";
export type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus =
  | "pending"
  | "sent"
  | "acknowledged";

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord = {
  receiptId: string;
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
  issuedAt: string | null;
  verifiedAt: string | null;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry = {
  channel: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel;
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus;
  referenceId: string;
  ticketId: string;
  note: string;
  sentAt: string | null;
  acknowledgedAt: string | null;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState = {
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
  allExceptionsResolved: boolean;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptSummary =
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState & {
    closureReceiptVerified: boolean;
    closureChannelPendingCount: number;
    closureChannelSentCount: number;
    closureChannelAcknowledgedCount: number;
    closureChannelTotalCount: number;
    closureChannelsAcknowledged: boolean;
    readyForExceptionClosureReceipt: boolean;
    blockers: string[];
  };

const CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_KEYS: ReadonlyArray<
  keyof ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState
> = [
  "handoffReady",
  "exportReady",
  "archiveReady",
  "routingReady",
  "signatureReady",
  "packageLocked",
  "handoverAcknowledged",
  "receiptVerified",
  "digestReady",
  "closeReportPublished",
  "publicationReady",
  "distributionReady",
  "signoffReady",
  "closurePacketSealed",
  "dispatchReady",
  "releaseDigestPublished",
  "releaseDigestDeliveryReady",
  "ackLedgerVerified",
  "ackChannelsReconciled",
  "exceptionLogClosed",
  "allExceptionsResolved"
];

const CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_BLOCKER_MAP: Record<
  keyof ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
  string
> = {
  handoffReady: "handoff snapshot is not ready",
  exportReady: "export snapshot is not ready",
  archiveReady: "archive package is not ready",
  routingReady: "approval routing bundle is not ready",
  signatureReady: "delivery signature bundle is not ready",
  packageLocked: "delivery package is not locked",
  handoverAcknowledged: "final handover is not acknowledged",
  receiptVerified: "completion receipt has not been verified",
  digestReady: "archive digest is not fully sealed",
  closeReportPublished: "completion close report is not published",
  publicationReady: "close report publication is not complete",
  distributionReady: "distribution channels are not fully confirmed",
  signoffReady: "distribution sign-off is not complete",
  closurePacketSealed: "closure packet is not sealed",
  dispatchReady: "closure packet dispatch is not fully released",
  releaseDigestPublished: "closure packet release digest is not published",
  releaseDigestDeliveryReady: "release digest channels are not fully delivered",
  ackLedgerVerified: "release digest acknowledgment ledger is not verified",
  ackChannelsReconciled: "acknowledgment channels are not fully reconciled",
  exceptionLogClosed: "acknowledgment exception log is not closed",
  allExceptionsResolved: "exception categories are not fully resolved"
};

function appendBooleanQueryParam(
  query: URLSearchParams,
  key: keyof ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
  value: boolean
) {
  query.set(key, value ? "1" : "0");
}

export function buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref(
  options: {
    metric: AlertMetric;
    level: FilingOpsAlertLevel;
    value: number | null;
    ownerRole: string;
    ownerActorId: string;
  } & ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState
) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level
  });

  for (const key of CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_KEYS) {
    appendBooleanQueryParam(query, key, options[key]);
  }
  if (options.value !== null) {
    query.set("value", String(options.value));
  }
  if (options.ownerRole.trim().length > 0) {
    query.set("ownerRole", options.ownerRole.trim());
  }
  if (options.ownerActorId.trim().length > 0) {
    query.set("ownerActorId", options.ownerActorId.trim());
  }

  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff/closure-packet/release-digest/ack-ledger/exception-log/closure-receipt?${query.toString()}`;
}

export function buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord(input: {
  receiptId: string;
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
  issuedAt?: string | null;
  verifiedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const issuedAt =
    input.status === "issued" || input.status === "verified" ? input.issuedAt?.trim() || timestamp : null;
  const verifiedAt = input.status === "verified" ? input.verifiedAt?.trim() || timestamp : null;

  return {
    receiptId: input.receiptId.trim() || `exception-closure-receipt-${timestamp}`,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    note: input.note.trim(),
    issuedAt,
    verifiedAt
  } satisfies ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord;
}

export function applyClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt(options: {
  current: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord;
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
  now?: Date;
}) {
  return buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord({
    receiptId: options.current.receiptId,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    note: options.note,
    issuedAt: options.current.issuedAt,
    verifiedAt: options.current.verifiedAt,
    now: options.now
  });
}

export function buildDefaultClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntries() {
  return [
    {
      channel: "ops_exception_closure_desk",
      status: "pending",
      referenceId: "",
      ticketId: "",
      note: "",
      sentAt: null,
      acknowledgedAt: null
    },
    {
      channel: "finance_exception_closure_desk",
      status: "pending",
      referenceId: "",
      ticketId: "",
      note: "",
      sentAt: null,
      acknowledgedAt: null
    },
    {
      channel: "audit_exception_closure_desk",
      status: "pending",
      referenceId: "",
      ticketId: "",
      note: "",
      sentAt: null,
      acknowledgedAt: null
    }
  ] satisfies ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry[];
}

export function buildClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry(input: {
  channel: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel;
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus;
  referenceId: string;
  ticketId: string;
  note: string;
  sentAt?: string | null;
  acknowledgedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const sentAt =
    input.status === "sent" || input.status === "acknowledged"
      ? input.sentAt?.trim() || timestamp
      : null;
  const acknowledgedAt =
    input.status === "acknowledged" ? input.acknowledgedAt?.trim() || timestamp : null;

  return {
    channel: input.channel,
    status: input.status,
    referenceId: input.referenceId.trim(),
    ticketId: input.ticketId.trim(),
    note: input.note.trim(),
    sentAt,
    acknowledgedAt
  } satisfies ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry;
}

export function applyClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus(options: {
  entries: readonly ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry[];
  channel: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel;
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus;
  referenceId: string;
  ticketId: string;
  note: string;
  now?: Date;
}) {
  const current = options.entries.find((entry) => entry.channel === options.channel);
  const next = buildClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry({
    channel: options.channel,
    status: options.status,
    referenceId: options.referenceId,
    ticketId: options.ticketId,
    note: options.note,
    sentAt: current?.sentAt,
    acknowledgedAt: current?.acknowledgedAt,
    now: options.now
  });

  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt(options: {
  closureReceiptRecord: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord;
  closureChannelEntries: readonly ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry[];
} & ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState): ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptSummary {
  const closureChannelTotalCount = options.closureChannelEntries.length;
  const closureChannelPendingCount = options.closureChannelEntries.filter(
    (entry) => entry.status === "pending"
  ).length;
  const closureChannelSentCount = options.closureChannelEntries.filter(
    (entry) => entry.status === "sent"
  ).length;
  const closureChannelAcknowledgedCount = options.closureChannelEntries.filter(
    (entry) => entry.status === "acknowledged"
  ).length;

  const closureChannelsAcknowledged =
    closureChannelTotalCount > 0 &&
    closureChannelAcknowledgedCount === closureChannelTotalCount &&
    closureChannelPendingCount === 0 &&
    closureChannelSentCount === 0;
  const closureReceiptVerified = options.closureReceiptRecord.status === "verified";

  const blockers: string[] = [];
  for (const key of CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_KEYS) {
    if (!options[key]) {
      blockers.push(CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_BLOCKER_MAP[key]);
    }
  }
  if (!closureReceiptVerified) {
    blockers.push("exception closure receipt is not verified");
  }
  if (!closureChannelsAcknowledged) {
    blockers.push("exception closure channels are not fully acknowledged");
  }

  const readyForExceptionClosureReceipt =
    CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_KEYS.every(
      (key) => options[key]
    ) &&
    closureReceiptVerified &&
    closureChannelsAcknowledged;

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
    exceptionLogClosed: options.exceptionLogClosed,
    allExceptionsResolved: options.allExceptionsResolved,
    closureReceiptVerified,
    closureChannelPendingCount,
    closureChannelSentCount,
    closureChannelAcknowledgedCount,
    closureChannelTotalCount,
    closureChannelsAcknowledged,
    readyForExceptionClosureReceipt,
    blockers
  };
}
