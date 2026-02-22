import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

export type ApprovalRoutingStage = "prepare" | "manager_review" | "admin_signoff" | "delivery_ack";
export type ApprovalRoutingStatus = "pending" | "in_progress" | "done" | "blocked";

export type ApprovalRoutingEntry = {
  stage: ApprovalRoutingStage;
  status: ApprovalRoutingStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  etaHours: number;
  note: string;
  updatedAt: string | null;
};

export type DeliverySignatureChannel = "hometax_upload" | "manual_portal" | "internal_archive";
export type DeliverySignatureStatus = "pending" | "signed" | "failed";

export type DeliverySignatureEntry = {
  channel: DeliverySignatureChannel;
  status: DeliverySignatureStatus;
  signerRole: ReviewHandoffRole;
  signerActorId: string;
  reference: string;
  signedAt: string | null;
};

export type RoutingSignatureBundleSummary = {
  routingTotalCount: number;
  routingDoneCount: number;
  routingPendingCount: number;
  routingInProgressCount: number;
  routingBlockedCount: number;
  signatureTotalCount: number;
  signatureSignedCount: number;
  signaturePendingCount: number;
  signatureFailedCount: number;
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
  routingReady: boolean;
  signatureReady: boolean;
  readyToDeliver: boolean;
  blockers: string[];
};

export function buildCloseOffRoutingSignatureBundleRouteHref(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  value: number | null;
  ownerRole: string;
  ownerActorId: string;
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level,
    handoffReady: options.handoffReady ? "1" : "0",
    exportReady: options.exportReady ? "1" : "0",
    archiveReady: options.archiveReady ? "1" : "0"
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot/handoff/close-off/routing-signature?${query.toString()}`;
}

export function buildDefaultApprovalRoutingEntries(ownerActorId: string) {
  const actor = ownerActorId.trim() || "OPS-ROUTING";
  return [
    {
      stage: "prepare",
      status: "pending",
      ownerRole: "payroll_operator",
      ownerActorId: actor,
      etaHours: 4,
      note: "",
      updatedAt: null
    },
    {
      stage: "manager_review",
      status: "pending",
      ownerRole: "manager",
      ownerActorId: "",
      etaHours: 8,
      note: "",
      updatedAt: null
    },
    {
      stage: "admin_signoff",
      status: "pending",
      ownerRole: "admin",
      ownerActorId: "",
      etaHours: 12,
      note: "",
      updatedAt: null
    },
    {
      stage: "delivery_ack",
      status: "pending",
      ownerRole: "manager",
      ownerActorId: "",
      etaHours: 16,
      note: "",
      updatedAt: null
    }
  ] satisfies ApprovalRoutingEntry[];
}

export function buildDefaultDeliverySignatureEntries() {
  return [
    {
      channel: "hometax_upload",
      status: "pending",
      signerRole: "manager",
      signerActorId: "",
      reference: "",
      signedAt: null
    },
    {
      channel: "manual_portal",
      status: "pending",
      signerRole: "payroll_operator",
      signerActorId: "",
      reference: "",
      signedAt: null
    },
    {
      channel: "internal_archive",
      status: "pending",
      signerRole: "admin",
      signerActorId: "",
      reference: "",
      signedAt: null
    }
  ] satisfies DeliverySignatureEntry[];
}

export function buildApprovalRoutingEntry(input: {
  stage: ApprovalRoutingStage;
  status: ApprovalRoutingStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  etaHours: number;
  note: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    stage: input.stage,
    status: input.status,
    ownerRole: input.ownerRole,
    ownerActorId: input.ownerActorId.trim(),
    etaHours: Number.isFinite(input.etaHours) ? Math.max(0, Math.trunc(input.etaHours)) : 0,
    note: input.note.trim(),
    updatedAt: input.status === "pending" ? null : now.toISOString()
  } satisfies ApprovalRoutingEntry;
}

export function applyApprovalRoutingStatus(options: {
  entries: readonly ApprovalRoutingEntry[];
  stage: ApprovalRoutingStage;
  status: ApprovalRoutingStatus;
  ownerRole: ReviewHandoffRole;
  ownerActorId: string;
  etaHours: number;
  note: string;
  now?: Date;
}) {
  const next = buildApprovalRoutingEntry({
    stage: options.stage,
    status: options.status,
    ownerRole: options.ownerRole,
    ownerActorId: options.ownerActorId,
    etaHours: options.etaHours,
    note: options.note,
    now: options.now
  });
  return options.entries.map((entry) => (entry.stage === options.stage ? next : entry));
}

export function buildDeliverySignatureEntry(input: {
  channel: DeliverySignatureChannel;
  status: DeliverySignatureStatus;
  signerRole: ReviewHandoffRole;
  signerActorId: string;
  reference: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  return {
    channel: input.channel,
    status: input.status,
    signerRole: input.signerRole,
    signerActorId: input.signerActorId.trim(),
    reference: input.reference.trim(),
    signedAt: input.status === "signed" ? now.toISOString() : null
  } satisfies DeliverySignatureEntry;
}

export function applyDeliverySignature(options: {
  entries: readonly DeliverySignatureEntry[];
  channel: DeliverySignatureChannel;
  status: DeliverySignatureStatus;
  signerRole: ReviewHandoffRole;
  signerActorId: string;
  reference: string;
  now?: Date;
}) {
  const next = buildDeliverySignatureEntry({
    channel: options.channel,
    status: options.status,
    signerRole: options.signerRole,
    signerActorId: options.signerActorId,
    reference: options.reference,
    now: options.now
  });
  return options.entries.map((entry) => (entry.channel === options.channel ? next : entry));
}

export function summarizeRoutingSignatureBundle(options: {
  routingEntries: readonly ApprovalRoutingEntry[];
  signatureEntries: readonly DeliverySignatureEntry[];
  handoffReady: boolean;
  exportReady: boolean;
  archiveReady: boolean;
}): RoutingSignatureBundleSummary {
  const routingTotalCount = options.routingEntries.length;
  const routingDoneCount = options.routingEntries.filter((entry) => entry.status === "done").length;
  const routingPendingCount = options.routingEntries.filter((entry) => entry.status === "pending").length;
  const routingInProgressCount = options.routingEntries.filter((entry) => entry.status === "in_progress").length;
  const routingBlockedCount = options.routingEntries.filter((entry) => entry.status === "blocked").length;

  const signatureTotalCount = options.signatureEntries.length;
  const signatureSignedCount = options.signatureEntries.filter((entry) => entry.status === "signed").length;
  const signaturePendingCount = options.signatureEntries.filter((entry) => entry.status === "pending").length;
  const signatureFailedCount = options.signatureEntries.filter((entry) => entry.status === "failed").length;

  const routingReady =
    routingTotalCount > 0 &&
    routingDoneCount === routingTotalCount &&
    routingBlockedCount === 0 &&
    routingPendingCount === 0;
  const signatureReady =
    signatureTotalCount > 0 &&
    signatureSignedCount === signatureTotalCount &&
    signatureFailedCount === 0 &&
    signaturePendingCount === 0;

  const blockers: string[] = [];
  if (!options.handoffReady) {
    blockers.push("handoff snapshot is not ready");
  }
  if (!options.exportReady) {
    blockers.push("export snapshot is not ready");
  }
  if (!options.archiveReady) {
    blockers.push("close-off archive package is not ready");
  }
  if (!routingReady) {
    blockers.push("approval routing is not fully completed");
  }
  if (!signatureReady) {
    blockers.push("delivery signature bundle is incomplete");
  }

  return {
    routingTotalCount,
    routingDoneCount,
    routingPendingCount,
    routingInProgressCount,
    routingBlockedCount,
    signatureTotalCount,
    signatureSignedCount,
    signaturePendingCount,
    signatureFailedCount,
    handoffReady: options.handoffReady,
    exportReady: options.exportReady,
    archiveReady: options.archiveReady,
    routingReady,
    signatureReady,
    readyToDeliver:
      options.handoffReady &&
      options.exportReady &&
      options.archiveReady &&
      routingReady &&
      signatureReady,
    blockers
  };
}
