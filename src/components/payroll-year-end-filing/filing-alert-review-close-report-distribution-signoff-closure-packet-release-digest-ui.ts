import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  ClosurePacketReleaseDigestChannel,
  ClosurePacketReleaseDigestChannelEntry,
  ClosurePacketReleaseDigestChannelStatus,
  ClosurePacketReleaseDigestStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ClosurePacketReleaseDigestGateState = {
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
};

export type ClosurePacketReleaseDigestDraft = {
  status: ClosurePacketReleaseDigestStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
};

export type ClosurePacketReleaseDigestChannelDraft = {
  status: ClosurePacketReleaseDigestChannelStatus;
  artifactId: string;
  referenceId: string;
  note: string;
};

export const CLOSURE_PACKET_RELEASE_DIGEST_CHANNEL_LABELS: Record<ClosurePacketReleaseDigestChannel, string> = {
  ops_digest_board: "Ops Digest Board",
  finance_digest_board: "Finance Digest Board",
  audit_digest_board: "Audit Digest Board"
};

export const CLOSURE_PACKET_RELEASE_DIGEST_GATE_FIELDS: ReadonlyArray<{
  key: keyof ClosurePacketReleaseDigestGateState;
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
  { key: "dispatchReady", label: "Dispatch Ready" }
];

export function buildClosurePacketReleaseDigestGateState(params: {
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
}): ClosurePacketReleaseDigestGateState {
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
    dispatchReady: parseBooleanQueryParam(params.dispatchReadyParam)
  };
}

export function buildClosurePacketReleaseDigestChannelDraftMap(
  entries: readonly ClosurePacketReleaseDigestChannelEntry[]
) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.channel] = {
        status: entry.status,
        artifactId: entry.artifactId,
        referenceId: entry.referenceId,
        note: entry.note
      };
      return acc;
    },
    {} as Record<ClosurePacketReleaseDigestChannel, ClosurePacketReleaseDigestChannelDraft>
  );
}
