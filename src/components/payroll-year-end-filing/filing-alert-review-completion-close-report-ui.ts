import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  CloseReportPublicationChannel,
  CloseReportPublicationEntry,
  CloseReportPublicationStatus,
  CompletionCloseReportStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type CloseReportGateState = {
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
  receiptVerified: boolean;
  digestReady: boolean;
};

export type CloseReportDraft = {
  status: CompletionCloseReportStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
};

export type CloseReportPublicationDraft = {
  status: CloseReportPublicationStatus;
  artifactId: string;
  receiptReference: string;
  note: string;
};

export const CLOSE_REPORT_PUBLICATION_LABELS: Record<CloseReportPublicationChannel, string> = {
  ops_digest: "Ops Digest",
  finance_archive: "Finance Archive",
  audit_room: "Audit Room"
};

export const CLOSE_REPORT_GATE_FIELDS: ReadonlyArray<{ key: keyof CloseReportGateState; label: string }> = [
  { key: "handoffReady", label: "Handoff Ready" },
  { key: "exportReady", label: "Export Ready" },
  { key: "archiveReady", label: "Archive Ready" },
  { key: "routingReady", label: "Routing Ready" },
  { key: "signatureReady", label: "Signature Ready" },
  { key: "packageLocked", label: "Package Locked" },
  { key: "handoverAcknowledged", label: "Handover Acked" },
  { key: "receiptVerified", label: "Receipt Verified" },
  { key: "digestReady", label: "Digest Ready" }
];

export function buildCloseReportGateState(params: {
  handoffReadyParam: string | null;
  exportReadyParam: string | null;
  archiveReadyParam: string | null;
  routingReadyParam: string | null;
  signatureReadyParam: string | null;
  packageLockedParam: string | null;
  handoverAcknowledgedParam: string | null;
  receiptVerifiedParam: string | null;
  digestReadyParam: string | null;
}): CloseReportGateState {
  return {
    handoffReady: parseBooleanQueryParam(params.handoffReadyParam),
    exportReady: parseBooleanQueryParam(params.exportReadyParam),
    archiveReady: parseBooleanQueryParam(params.archiveReadyParam),
    routingReady: parseBooleanQueryParam(params.routingReadyParam),
    signatureReady: parseBooleanQueryParam(params.signatureReadyParam),
    packageLocked: parseBooleanQueryParam(params.packageLockedParam),
    handoverAcknowledged: parseBooleanQueryParam(params.handoverAcknowledgedParam),
    receiptVerified: parseBooleanQueryParam(params.receiptVerifiedParam),
    digestReady: parseBooleanQueryParam(params.digestReadyParam)
  };
}

export function buildCloseReportPublicationDraftMap(entries: readonly CloseReportPublicationEntry[]) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.channel] = {
        status: entry.status,
        artifactId: entry.artifactId,
        receiptReference: entry.receiptReference,
        note: entry.note
      };
      return acc;
    },
    {} as Record<CloseReportPublicationChannel, CloseReportPublicationDraft>
  );
}
