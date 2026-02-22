import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  ClosurePacketDispatchChannel,
  ClosurePacketDispatchEntry,
  ClosurePacketDispatchStatus,
  ClosurePacketStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type CloseReportDistributionSignoffClosurePacketGateState = {
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
};

export type ClosurePacketDraft = {
  status: ClosurePacketStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
};

export type ClosurePacketDispatchDraft = {
  status: ClosurePacketDispatchStatus;
  artifactId: string;
  checksum: string;
  note: string;
};

export const CLOSURE_PACKET_DISPATCH_LABELS: Record<ClosurePacketDispatchChannel, string> = {
  ops_archive_room: "Ops Archive Room",
  finance_archive_room: "Finance Archive Room",
  compliance_vault: "Compliance Vault"
};

export const CLOSE_REPORT_DISTRIBUTION_SIGNOFF_CLOSURE_PACKET_GATE_FIELDS: ReadonlyArray<{
  key: keyof CloseReportDistributionSignoffClosurePacketGateState;
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
  { key: "signoffReady", label: "Sign-off Ready" }
];

export function buildCloseReportDistributionSignoffClosurePacketGateState(params: {
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
}): CloseReportDistributionSignoffClosurePacketGateState {
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
    signoffReady: parseBooleanQueryParam(params.signoffReadyParam)
  };
}

export function buildClosurePacketDispatchDraftMap(entries: readonly ClosurePacketDispatchEntry[]) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.channel] = {
        status: entry.status,
        artifactId: entry.artifactId,
        checksum: entry.checksum,
        note: entry.note
      };
      return acc;
    },
    {} as Record<ClosurePacketDispatchChannel, ClosurePacketDispatchDraft>
  );
}
