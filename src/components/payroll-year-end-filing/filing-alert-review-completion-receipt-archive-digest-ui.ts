import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type {
  ArchiveDigestChannel,
  ArchiveDigestEntry,
  ArchiveDigestStatus,
  CompletionReceiptStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type GateState = {
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
};

export type ReceiptDraft = {
  status: CompletionReceiptStatus;
  issuedByRole: ReviewHandoffRole;
  issuedByActorId: string;
  note: string;
};

export type DigestDraft = {
  status: ArchiveDigestStatus;
  artifactId: string;
  checksum: string;
  note: string;
};

export const DIGEST_LABELS: Record<ArchiveDigestChannel, string> = {
  hometax_bundle: "HomeTax Bundle",
  internal_archive: "Internal Archive",
  ops_receipt: "Ops Receipt"
};

export const GATE_FIELDS: ReadonlyArray<{ key: keyof GateState; label: string }> = [
  { key: "handoffReady", label: "Handoff Ready" },
  { key: "exportReady", label: "Export Ready" },
  { key: "archiveReady", label: "Archive Ready" },
  { key: "routingReady", label: "Routing Ready" },
  { key: "signatureReady", label: "Signature Ready" },
  { key: "packageLocked", label: "Package Locked" },
  { key: "handoverAcknowledged", label: "Handover Acked" }
];

export function buildGateState(params: {
  handoffReadyParam: string | null;
  exportReadyParam: string | null;
  archiveReadyParam: string | null;
  routingReadyParam: string | null;
  signatureReadyParam: string | null;
  packageLockedParam: string | null;
  handoverAcknowledgedParam: string | null;
}): GateState {
  return {
    handoffReady: parseBooleanQueryParam(params.handoffReadyParam),
    exportReady: parseBooleanQueryParam(params.exportReadyParam),
    archiveReady: parseBooleanQueryParam(params.archiveReadyParam),
    routingReady: parseBooleanQueryParam(params.routingReadyParam),
    signatureReady: parseBooleanQueryParam(params.signatureReadyParam),
    packageLocked: parseBooleanQueryParam(params.packageLockedParam),
    handoverAcknowledged: parseBooleanQueryParam(params.handoverAcknowledgedParam)
  };
}

export function buildDigestDraftMap(entries: readonly ArchiveDigestEntry[]) {
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
    {} as Record<ArchiveDigestChannel, DigestDraft>
  );
}
