import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type CompletionCloseReportStatus = "pending" | "drafted" | "published";
export type CloseReportPublicationChannel = "ops_digest" | "finance_archive" | "audit_room";
export type CloseReportPublicationStatus = "pending" | "queued" | "published";

export type CompletionCloseReportRecord = {
  reportId: string;
  status: CompletionCloseReportStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  draftedAt: string | null;
  publishedAt: string | null;
};

export type CloseReportPublicationEntry = {
  channel: CloseReportPublicationChannel;
  status: CloseReportPublicationStatus;
  artifactId: string;
  receiptReference: string;
  note: string;
  updatedAt: string | null;
};

export type CompletionCloseReportSummary = {
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
  publicationQueuedCount: number;
  publicationPublishedCount: number;
  publicationTotalCount: number;
  publicationReady: boolean;
  readyToClose: boolean;
  blockers: string[];
};

export function buildCompletionReceiptCloseReportRouteHref(options: {
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
    digestReady: options.digestReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report?${query.toString()}`;
}

export function buildCompletionCloseReportRecord(input: {
  reportId: string;
  status: CompletionCloseReportStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  draftedAt?: string | null;
  publishedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const draftedAt =
    input.status === "drafted" || input.status === "published"
      ? input.draftedAt?.trim() || timestamp
      : null;
  const publishedAt = input.status === "published" ? input.publishedAt?.trim() || timestamp : null;

  return {
    reportId: input.reportId.trim() || `close-report-${timestamp}`,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    summary: input.summary.trim(),
    draftedAt,
    publishedAt
  } satisfies CompletionCloseReportRecord;
}

export function applyCompletionCloseReport(options: {
  current: CompletionCloseReportRecord;
  status: CompletionCloseReportStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  summary: string;
  now?: Date;
}) {
  return buildCompletionCloseReportRecord({
    reportId: options.current.reportId,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    summary: options.summary,
    draftedAt: options.current.draftedAt,
    publishedAt: options.current.publishedAt,
    now: options.now
  });
}

export function buildDefaultCloseReportPublicationEntries() {
  return [
    {
      channel: "ops_digest",
      status: "pending",
      artifactId: "",
      receiptReference: "",
      note: "",
      updatedAt: null
    },
    {
      channel: "finance_archive",
      status: "pending",
      artifactId: "",
      receiptReference: "",
      note: "",
      updatedAt: null
    },
    {
      channel: "audit_room",
      status: "pending",
      artifactId: "",
      receiptReference: "",
      note: "",
      updatedAt: null
    }
  ] satisfies CloseReportPublicationEntry[];
}

export function buildCloseReportPublicationEntry(input: {
  channel: CloseReportPublicationChannel;
  status: CloseReportPublicationStatus;
  artifactId: string;
  receiptReference: string;
  note: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    channel: input.channel,
    status: input.status,
    artifactId: input.artifactId.trim(),
    receiptReference: input.receiptReference.trim(),
    note: input.note.trim(),
    updatedAt: input.status === "pending" ? null : now.toISOString()
  } satisfies CloseReportPublicationEntry;
}

export function applyCloseReportPublicationStatus(options: {
  entries: readonly CloseReportPublicationEntry[];
  channel: CloseReportPublicationChannel;
  status: CloseReportPublicationStatus;
  artifactId: string;
  receiptReference: string;
  note: string;
  now?: Date;
}) {
  const next = buildCloseReportPublicationEntry({
    channel: options.channel,
    status: options.status,
    artifactId: options.artifactId,
    receiptReference: options.receiptReference,
    note: options.note,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeCompletionCloseReport(options: {
  closeReportRecord: CompletionCloseReportRecord;
  publicationEntries: readonly CloseReportPublicationEntry[];
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  packageLocked: boolean;
  handoverAcknowledged: boolean;
  receiptVerified: boolean;
  digestReady: boolean;
}): CompletionCloseReportSummary {
  const publicationTotalCount = options.publicationEntries.length;
  const publicationQueuedCount = options.publicationEntries.filter((entry) => entry.status === "queued").length;
  const publicationPublishedCount = options.publicationEntries.filter((entry) => entry.status === "published").length;
  const publicationPendingCount = options.publicationEntries.filter((entry) => entry.status === "pending").length;
  const publicationReady =
    publicationTotalCount > 0 &&
    publicationPublishedCount === publicationTotalCount &&
    publicationPendingCount === 0;

  const closeReportPublished = options.closeReportRecord.status === "published";

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
  if (!closeReportPublished) {
    blockers.push("completion close report is not published");
  }
  if (!publicationReady) {
    blockers.push("close report publication channels are not fully published");
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
    closeReportPublished,
    publicationQueuedCount,
    publicationPublishedCount,
    publicationTotalCount,
    publicationReady,
    readyToClose:
      options.handoffReady &&
      options.exportReady &&
      options.archiveReady &&
      options.routingReady &&
      options.signatureReady &&
      options.packageLocked &&
      options.handoverAcknowledged &&
      options.receiptVerified &&
      options.digestReady &&
      closeReportPublished &&
      publicationReady,
    blockers
  };
}
