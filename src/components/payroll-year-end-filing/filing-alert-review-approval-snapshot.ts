import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";

export type RetrospectiveCommentCategory = "what_went_well" | "risk" | "follow_up";

export type RetrospectiveCommentEntry = {
  commentId: string;
  category: RetrospectiveCommentCategory;
  comment: string;
  actorId: string;
  at: string;
};

export type ReviewApprovalRole = "payroll_operator" | "manager" | "admin";
export type ReviewApprovalDecision = "pending" | "approved" | "rework";

export type ReviewApprovalSnapshotEntry = {
  role: ReviewApprovalRole;
  decision: ReviewApprovalDecision;
  actorId: string;
  note: string;
  decidedAt: string | null;
};

export type ReviewApprovalSnapshotSummary = {
  totalCount: number;
  approvedCount: number;
  reworkCount: number;
  pendingCount: number;
  readyToClose: boolean;
};

export function buildChecklistReviewSnapshotRouteHref(options: {
  metric: AlertMetric;
  level: FilingOpsAlertLevel;
  value: number | null;
  ownerRole: string;
  ownerActorId: string;
}) {
  const query = new URLSearchParams({
    metric: options.metric,
    level: options.level
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
  return `/admin/payroll-year-end-filing/ops/checklist/review/snapshot?${query.toString()}`;
}

export function buildRetrospectiveCommentEntry(input: {
  category: RetrospectiveCommentCategory;
  comment: string;
  actorId: string;
  now?: Date;
}) {
  const now = input.now ?? new Date();
  const actorId = input.actorId.trim() || "RETRO-UNKNOWN";
  const comment = input.comment.trim();
  const category = input.category;
  const at = now.toISOString();
  return {
    commentId: `${category}:${actorId}:${at}`,
    category,
    comment,
    actorId,
    at
  } satisfies RetrospectiveCommentEntry;
}

export function summarizeReviewApprovalSnapshot(
  entries: readonly ReviewApprovalSnapshotEntry[]
): ReviewApprovalSnapshotSummary {
  const totalCount = entries.length;
  const approvedCount = entries.filter((entry) => entry.decision === "approved").length;
  const reworkCount = entries.filter((entry) => entry.decision === "rework").length;
  const pendingCount = entries.filter((entry) => entry.decision === "pending").length;
  const readyToClose = totalCount > 0 && approvedCount === totalCount && reworkCount === 0;
  return {
    totalCount,
    approvedCount,
    reworkCount,
    pendingCount,
    readyToClose
  };
}

export function applyReviewApprovalDecision(options: {
  entries: readonly ReviewApprovalSnapshotEntry[];
  role: ReviewApprovalRole;
  decision: ReviewApprovalDecision;
  actorId: string;
  note: string;
  now?: Date;
}) {
  const now = options.now ?? new Date();
  const decidedAt = options.decision === "pending" ? null : now.toISOString();
  return options.entries.map((entry) => {
    if (entry.role !== options.role) {
      return entry;
    }
    return {
      ...entry,
      decision: options.decision,
      actorId: options.actorId.trim(),
      note: options.note.trim(),
      decidedAt
    } satisfies ReviewApprovalSnapshotEntry;
  });
}
