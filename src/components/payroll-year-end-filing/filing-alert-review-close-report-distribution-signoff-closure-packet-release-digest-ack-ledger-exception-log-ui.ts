import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  ClosurePacketReleaseDigestAckLedgerExceptionCategory,
  ClosurePacketReleaseDigestAckLedgerExceptionEntry,
  ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus,
  ClosurePacketReleaseDigestAckLedgerExceptionLogStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestAckLedgerExceptionLogGateState = {
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
};

export type ClosurePacketReleaseDigestAckLedgerExceptionLogDraft = {
  status: ClosurePacketReleaseDigestAckLedgerExceptionLogStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
};

export type ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft = {
  status: ClosurePacketReleaseDigestAckLedgerExceptionEntryStatus;
  incidentId: string;
  referenceId: string;
  note: string;
};

export const CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_CATEGORY_LABELS: Record<
  ClosurePacketReleaseDigestAckLedgerExceptionCategory,
  string
> = {
  ops_exception_desk: "Ops Exception Desk",
  finance_exception_desk: "Finance Exception Desk",
  audit_exception_desk: "Audit Exception Desk"
};

export const CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_LOG_GATE_FIELDS: ReadonlyArray<{
  key: keyof ClosurePacketReleaseDigestAckLedgerExceptionLogGateState;
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
  { key: "ackChannelsReconciled", label: "Ack Channels Reconciled" }
];

export function buildClosurePacketReleaseDigestAckLedgerExceptionLogGateState(params: {
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
}): ClosurePacketReleaseDigestAckLedgerExceptionLogGateState {
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
    ackChannelsReconciled: parseBooleanQueryParam(params.ackChannelsReconciledParam)
  };
}

export function buildClosurePacketReleaseDigestAckLedgerExceptionEntryDraftMap(
  entries: readonly ClosurePacketReleaseDigestAckLedgerExceptionEntry[]
) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.category] = {
        status: entry.status,
        incidentId: entry.incidentId,
        referenceId: entry.referenceId,
        note: entry.note
      };
      return acc;
    },
    {} as Record<
      ClosurePacketReleaseDigestAckLedgerExceptionCategory,
      ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft
    >
  );
}
