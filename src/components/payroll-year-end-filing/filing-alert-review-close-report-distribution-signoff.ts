import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type CloseReportDistributionChannel = "ops_broadcast" | "finance_notice" | "audit_notice";
export type CloseReportDistributionStatus = "pending" | "distributed" | "confirmed";
export type CloseReportSignoffStatus = "pending" | "signed" | "rejected";

export type CloseReportDistributionEntry = {
  channel: CloseReportDistributionChannel;
  status: CloseReportDistributionStatus;
  batchId: string;
  targetGroup: string;
  note: string;
  distributedAt: string | null;
  confirmedAt: string | null;
};

export type CloseReportSignoffEntry = {
  role: ReviewHandoffRole;
  status: CloseReportSignoffStatus;
  actorId: string;
  note: string;
  signedAt: string | null;
};

export type CloseReportDistributionSignoffSummary = {
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
  distributionConfirmedCount: number;
  distributionTotalCount: number;
  distributionReady: boolean;
  signoffSignedCount: number;
  signoffTotalCount: number;
  signoffRejectedCount: number;
  signoffReady: boolean;
  readyForDistributionSignoff: boolean;
  blockers: string[];
};

export function buildCloseReportDistributionSignoffRouteHref(options: {
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
    publicationReady: options.publicationReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature/delivery-lock/completion-receipt/close-report/distribution-signoff?${query.toString()}`;
}

export function buildDefaultCloseReportDistributionEntries() {
  return [
    {
      channel: "ops_broadcast",
      status: "pending",
      batchId: "",
      targetGroup: "ops_team",
      note: "",
      distributedAt: null,
      confirmedAt: null
    },
    {
      channel: "finance_notice",
      status: "pending",
      batchId: "",
      targetGroup: "finance_team",
      note: "",
      distributedAt: null,
      confirmedAt: null
    },
    {
      channel: "audit_notice",
      status: "pending",
      batchId: "",
      targetGroup: "audit_team",
      note: "",
      distributedAt: null,
      confirmedAt: null
    }
  ] satisfies CloseReportDistributionEntry[];
}

export function buildCloseReportDistributionEntry(input: {
  channel: CloseReportDistributionChannel;
  status: CloseReportDistributionStatus;
  batchId: string;
  targetGroup: string;
  note: string;
  distributedAt?: string | null;
  confirmedAt?: string | null;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const timestamp = now.toISOString();
  const distributedAt =
    input.status === "distributed" || input.status === "confirmed"
      ? input.distributedAt?.trim() || timestamp
      : null;
  const confirmedAt = input.status === "confirmed" ? input.confirmedAt?.trim() || timestamp : null;
  return {
    channel: input.channel,
    status: input.status,
    batchId: input.batchId.trim(),
    targetGroup: input.targetGroup.trim(),
    note: input.note.trim(),
    distributedAt,
    confirmedAt
  } satisfies CloseReportDistributionEntry;
}

export function applyCloseReportDistributionStatus(options: {
  entries: readonly CloseReportDistributionEntry[];
  channel: CloseReportDistributionChannel;
  status: CloseReportDistributionStatus;
  batchId: string;
  targetGroup: string;
  note: string;
  now?: Date;
}) {
  const current = options.entries.find((entry) => entry.channel === options.channel);
  const next = buildCloseReportDistributionEntry({
    channel: options.channel,
    status: options.status,
    batchId: options.batchId,
    targetGroup: options.targetGroup,
    note: options.note,
    distributedAt: current?.distributedAt,
    confirmedAt: current?.confirmedAt,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function buildDefaultCloseReportSignoffEntries() {
  return [
    {
      role: "manager",
      status: "pending",
      actorId: "",
      note: "",
      signedAt: null
    },
    {
      role: "admin",
      status: "pending",
      actorId: "",
      note: "",
      signedAt: null
    },
    {
      role: "payroll_operator",
      status: "pending",
      actorId: "",
      note: "",
      signedAt: null
    }
  ] satisfies CloseReportSignoffEntry[];
}

export function buildCloseReportSignoffEntry(input: {
  role: ReviewHandoffRole;
  status: CloseReportSignoffStatus;
  actorId: string;
  note: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    role: input.role,
    status: input.status,
    actorId: input.actorId.trim(),
    note: input.note.trim(),
    signedAt: input.status === "signed" ? now.toISOString() : null
  } satisfies CloseReportSignoffEntry;
}

export function applyCloseReportSignoffStatus(options: {
  entries: readonly CloseReportSignoffEntry[];
  role: ReviewHandoffRole;
  status: CloseReportSignoffStatus;
  actorId: string;
  note: string;
  now?: Date;
}) {
  const next = buildCloseReportSignoffEntry({
    role: options.role,
    status: options.status,
    actorId: options.actorId,
    note: options.note,
    now: options.now
  });
  return options.entries.map((entry) => (entry.role === options.role ? next : entry));
}

export function summarizeCloseReportDistributionSignoff(options: {
  distributionEntries: readonly CloseReportDistributionEntry[];
  signoffEntries: readonly CloseReportSignoffEntry[];
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
}): CloseReportDistributionSignoffSummary {
  const distributionTotalCount = options.distributionEntries.length;
  const distributionConfirmedCount = options.distributionEntries.filter(
    (entry) => entry.status === "confirmed"
  ).length;
  const distributionPendingCount = options.distributionEntries.filter(
    (entry) => entry.status === "pending"
  ).length;
  const distributionReady =
    distributionTotalCount > 0 &&
    distributionConfirmedCount === distributionTotalCount &&
    distributionPendingCount === 0;

  const signoffTotalCount = options.signoffEntries.length;
  const signoffSignedCount = options.signoffEntries.filter((entry) => entry.status === "signed").length;
  const signoffRejectedCount = options.signoffEntries.filter((entry) => entry.status === "rejected").length;
  const signoffPendingCount = options.signoffEntries.filter((entry) => entry.status === "pending").length;
  const signoffReady =
    signoffTotalCount > 0 &&
    signoffSignedCount === signoffTotalCount &&
    signoffRejectedCount === 0 &&
    signoffPendingCount === 0;

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
  if (!distributionReady) {
    blockers.push("distribution channels are not fully confirmed");
  }
  if (!signoffReady) {
    blockers.push("distribution sign-off is not complete");
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
    distributionConfirmedCount,
    distributionTotalCount,
    distributionReady,
    signoffSignedCount,
    signoffTotalCount,
    signoffRejectedCount,
    signoffReady,
    readyForDistributionSignoff:
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
      distributionReady &&
      signoffReady,
    blockers
  };
}
