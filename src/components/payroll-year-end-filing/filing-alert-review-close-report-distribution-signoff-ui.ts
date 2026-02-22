import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  CloseReportDistributionChannel,
  CloseReportDistributionEntry,
  CloseReportDistributionStatus,
  CloseReportSignoffEntry,
  CloseReportSignoffStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type CloseReportDistributionSignoffGateState = {
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
};

export type CloseReportDistributionDraft = {
  status: CloseReportDistributionStatus;
  batchId: string;
  targetGroup: string;
  note: string;
};

export type CloseReportSignoffDraft = {
  status: CloseReportSignoffStatus;
  actorId: string;
  note: string;
};

export const CLOSE_REPORT_DISTRIBUTION_LABELS: Record<CloseReportDistributionChannel, string> = {
  ops_broadcast: "Ops Broadcast",
  finance_notice: "Finance Notice",
  audit_notice: "Audit Notice"
};

export const CLOSE_REPORT_SIGNOFF_ROLE_LABELS: Record<ReviewHandoffRole, string> = {
  payroll_operator: "Payroll Operator",
  manager: "Manager",
  admin: "Admin"
};

export const CLOSE_REPORT_DISTRIBUTION_GATE_FIELDS: ReadonlyArray<{
  key: keyof CloseReportDistributionSignoffGateState;
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
  { key: "publicationReady", label: "Publication Ready" }
];

export function buildCloseReportDistributionSignoffGateState(params: {
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
}): CloseReportDistributionSignoffGateState {
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
    publicationReady: parseBooleanQueryParam(params.publicationReadyParam)
  };
}

export function buildCloseReportDistributionDraftMap(entries: readonly CloseReportDistributionEntry[]) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.channel] = {
        status: entry.status,
        batchId: entry.batchId,
        targetGroup: entry.targetGroup,
        note: entry.note
      };
      return acc;
    },
    {} as Record<CloseReportDistributionChannel, CloseReportDistributionDraft>
  );
}

export function buildCloseReportSignoffDraftMap(entries: readonly CloseReportSignoffEntry[]) {
  return entries.reduce(
    (acc, entry) => {
      acc[entry.role] = {
        status: entry.status,
        actorId: entry.actorId,
        note: entry.note
      };
      return acc;
    },
    {} as Record<ReviewHandoffRole, CloseReportSignoffDraft>
  );
}
