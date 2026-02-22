import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
  ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptDraft = {
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  note: string;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft = {
  status: ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus;
  referenceId: string;
  ticketId: string;
  note: string;
};

export const CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_CHANNEL_LABELS: Record<
  ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
  string
> = {
  ops_exception_closure_desk: "Ops Exception Closure Desk",
  finance_exception_closure_desk: "Finance Exception Closure Desk",
  audit_exception_closure_desk: "Audit Exception Closure Desk"
};

export const CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CLOSURE_GATE_FIELDS: ReadonlyArray<{
  key: keyof ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState;
  label: string;
}> = [
  { key: "handoffReady", label: "Handoff Ready" },
  { key: "exportReady", label: "Export Ready" },
  { key: "archiveReady", label: "Archive Ready" },
  { key: "routingReady", label: "Routing Ready" },
  { key: "signatureReady", label: "Signature Ready" },
  { key: "packageLocked", label: "Package Locked" },
  { key: "handoverAcknowledged", label: "Handover Acked" },
  { key: "receiptVerified", label: "Receipt Verified" },
  { key: "digestReady", label: "Digest Ready" },
  { key: "closeReportPublished", label: "Close Report Published" },
  { key: "publicationReady", label: "Publication Ready" },
  { key: "distributionReady", label: "Distribution Ready" },
  { key: "signoffReady", label: "Sign-off Ready" },
  { key: "closurePacketSealed", label: "Closure Packet Sealed" },
  { key: "dispatchReady", label: "Dispatch Ready" },
  { key: "releaseDigestPublished", label: "Release Digest Published" },
  { key: "releaseDigestDeliveryReady", label: "Release Digest Delivery Ready" },
  { key: "ackLedgerVerified", label: "Ack Ledger Verified" },
  { key: "ackChannelsReconciled", label: "Ack Channels Reconciled" },
  { key: "exceptionLogClosed", label: "Exception Log Closed" },
  { key: "allExceptionsResolved", label: "All Exceptions Resolved" }
];

export function buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState(params: {
  handoffReadyParam: string | null;
  exportReadyParam: string | null;
  archiveReadyParam: string | null;
  routingReadyParam: string | null;
  signatureReadyParam: string | null;
  packageLockedParam: string | null;
  handoverAcknowledgedParam: string | null;
  receiptVerifiedParam: string | null;
  digestReadyParam: string | null;
  closeReportPublishedParam: string | null;
  publicationReadyParam: string | null;
  distributionReadyParam: string | null;
  signoffReadyParam: string | null;
  closurePacketSealedParam: string | null;
  dispatchReadyParam: string | null;
  releaseDigestPublishedParam: string | null;
  releaseDigestDeliveryReadyParam: string | null;
  ackLedgerVerifiedParam: string | null;
  ackChannelsReconciledParam: string | null;
  exceptionLogClosedParam: string | null;
  allExceptionsResolvedParam: string | null;
}): ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState {
  return {
    handoffReady: parseBooleanQueryParam(params.handoffReadyParam),
    exportReady: parseBooleanQueryParam(params.exportReadyParam),
    archiveReady: parseBooleanQueryParam(params.archiveReadyParam),
    routingReady: parseBooleanQueryParam(params.routingReadyParam),
    signatureReady: parseBooleanQueryParam(params.signatureReadyParam),
    packageLocked: parseBooleanQueryParam(params.packageLockedParam),
    handoverAcknowledged: parseBooleanQueryParam(params.handoverAcknowledgedParam),
    receiptVerified: parseBooleanQueryParam(params.receiptVerifiedParam),
    digestReady: parseBooleanQueryParam(params.digestReadyParam),
    closeReportPublished: parseBooleanQueryParam(params.closeReportPublishedParam),
    publicationReady: parseBooleanQueryParam(params.publicationReadyParam),
    distributionReady: parseBooleanQueryParam(params.distributionReadyParam),
    signoffReady: parseBooleanQueryParam(params.signoffReadyParam),
    closurePacketSealed: parseBooleanQueryParam(params.closurePacketSealedParam),
    dispatchReady: parseBooleanQueryParam(params.dispatchReadyParam),
    releaseDigestPublished: parseBooleanQueryParam(params.releaseDigestPublishedParam),
    releaseDigestDeliveryReady: parseBooleanQueryParam(params.releaseDigestDeliveryReadyParam),
    ackLedgerVerified: parseBooleanQueryParam(params.ackLedgerVerifiedParam),
    ackChannelsReconciled: parseBooleanQueryParam(params.ackChannelsReconciledParam),
    exceptionLogClosed: parseBooleanQueryParam(params.exceptionLogClosedParam),
    allExceptionsResolved: parseBooleanQueryParam(params.allExceptionsResolvedParam)
  };
}

export function buildClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraftMap(
  entries: readonly ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry[]
) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.channel] = {
        status: entry.status,
        referenceId: entry.referenceId,
        ticketId: entry.ticketId,
        note: entry.note
      };
      return acc;
    },
    {} as Record<
      ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
      ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft
    >
  );
}
