"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewApprovalSnapshot.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { normalizeAlertLevel, normalizeMetric, parseOptionalInt } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildChecklistReviewRouteHref } from "@/components/payroll-year-end-filing/filing-alert-execution-review-loop";
import { buildReviewSnapshotHandoffRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";
import {
  applyReviewApprovalDecision,
  buildRetrospectiveCommentEntry,
  summarizeReviewApprovalSnapshot,
  type RetrospectiveCommentCategory,
  type RetrospectiveCommentEntry,
  type ReviewApprovalDecision,
  type ReviewApprovalRole,
  type ReviewApprovalSnapshotEntry
} from "@/components/payroll-year-end-filing/filing-alert-review-approval-snapshot";

type ApprovalDraft = {
  decision: ReviewApprovalDecision;
  actorId: string;
  note: string;
};

const DEFAULT_APPROVAL_ENTRIES: ReviewApprovalSnapshotEntry[] = [
  { role: "payroll_operator", decision: "pending", actorId: "", note: "", decidedAt: null },
  { role: "manager", decision: "pending", actorId: "", note: "", decidedAt: null },
  { role: "admin", decision: "pending", actorId: "", note: "", decidedAt: null }
];

const ROLE_LABELS: Record<ReviewApprovalRole, string> = {
  payroll_operator: "Payroll Operator",
  manager: "Manager",
  admin: "Admin"
};

function copyDefaultApprovalEntries() {
  return DEFAULT_APPROVAL_ENTRIES.map((entry) => ({ ...entry }));
}

function buildDefaultDrafts(ownerActorId: string) {
  const actor = ownerActorId.trim();
  return {
    payroll_operator: { decision: "pending", actorId: actor, note: "" },
    manager: { decision: "pending", actorId: "", note: "" },
    admin: { decision: "pending", actorId: "", note: "" }
  } satisfies Record<ReviewApprovalRole, ApprovalDraft>;
}

function decisionBadgeClass(decision: ReviewApprovalDecision) {
  if (decision === "approved") {
    return `${styles.decisionBadge} ${styles.decisionApproved}`;
  }
  if (decision === "rework") {
    return `${styles.decisionBadge} ${styles.decisionRework}`;
  }
  return `${styles.decisionBadge} ${styles.decisionPending}`;
}

export default function PayrollYearEndFilingOpsReviewApprovalSnapshot() {
  const searchParams = useSearchParams();
  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(searchParams.get("metric")));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() =>
    normalizeAlertLevel(searchParams.get("level"))
  );
  const [ownerRole, setOwnerRole] = useState(() => (searchParams.get("ownerRole") ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(
    () => (searchParams.get("ownerActorId") ?? "").trim()
  );
  const [currentValueInput, setCurrentValueInput] = useState(searchParams.get("value") ?? "");
  const [comments, setComments] = useState<RetrospectiveCommentEntry[]>([]);
  const [commentCategory, setCommentCategory] = useState<RetrospectiveCommentCategory>("what_went_well");
  const [commentText, setCommentText] = useState("");
  const [commentActorId, setCommentActorId] = useState(
    () => (searchParams.get("ownerActorId") ?? "").trim() || "RETRO-1001"
  );
  const [approvals, setApprovals] = useState<ReviewApprovalSnapshotEntry[]>(copyDefaultApprovalEntries());
  const [approvalDrafts, setApprovalDrafts] = useState<Record<ReviewApprovalRole, ApprovalDraft>>(() =>
    buildDefaultDrafts(searchParams.get("ownerActorId") ?? "")
  );

  const metricParam = searchParams.get("metric");
  const levelParam = searchParams.get("level");
  const ownerRoleParam = searchParams.get("ownerRole");
  const ownerActorIdParam = searchParams.get("ownerActorId");
  const valueParam = searchParams.get("value");

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const nextValueInput = valueParam ?? "";

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(nextValueInput);
    setComments([]);
    setCommentCategory("what_went_well");
    setCommentText("");
    setCommentActorId(normalizedOwnerActorId || "RETRO-1001");
    setApprovals(copyDefaultApprovalEntries());
    setApprovalDrafts(buildDefaultDrafts(normalizedOwnerActorId));
  }, [metricParam, levelParam, ownerRoleParam, ownerActorIdParam, valueParam]);

  const currentValue = parseOptionalInt(currentValueInput);
  const reviewLoopHref = buildChecklistReviewRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId
  });
  const summary = useMemo(() => summarizeReviewApprovalSnapshot(approvals), [approvals]);
  const handoffExportSnapshotHref = buildReviewSnapshotHandoffRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    approvedCount: summary.approvedCount,
    pendingCount: summary.pendingCount,
    reworkCount: summary.reworkCount,
    totalCount: summary.totalCount
  });

  function appendComment() {
    const next = buildRetrospectiveCommentEntry({
      category: commentCategory,
      comment: commentText,
      actorId: commentActorId
    });
    if (next.comment.length === 0) {
      return;
    }
    setComments((prev) => [next, ...prev]);
    setCommentText("");
  }

  function updateApprovalDraft(role: ReviewApprovalRole, key: keyof ApprovalDraft, value: string) {
    setApprovalDrafts((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: value
      }
    }));
  }

  function applyDecision(role: ReviewApprovalRole) {
    const draft = approvalDrafts[role];
    setApprovals((prev) =>
      applyReviewApprovalDecision({
        entries: prev,
        role,
        decision: draft.decision,
        actorId: draft.actorId,
        note: draft.note
      })
    );
  }

  return (
    <section className="panel" id="filing-alert-review-approval-snapshot">
      <h2>Payroll Filing Alert Review Approval Snapshot</h2>
      <p className="small">Capture retrospective comments and approval decisions before close-off.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={reviewLoopHref} className="btn btn-secondary btn-small">
          Back to Review Loop
        </Link>
        <Link href={handoffExportSnapshotHref} className="btn btn-secondary btn-small">
          Open Handoff + Export Snapshot
        </Link>
      </div>

      <div className={styles.snapshotContextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"}
        </p>
        <p className="small">
          approval status{" "}
          <span
            className={`${styles.snapshotStatusBadge} ${
              summary.readyToClose ? styles.snapshotStatusReady : styles.snapshotStatusHold
            }`}
          >
            {summary.readyToClose ? "ready to close" : "hold"}
          </span>
        </p>
      </div>

      <p className={`small ${summary.readyToClose ? "ok" : "fail"}`}>
        approved {summary.approvedCount}/{summary.totalCount}, pending {summary.pendingCount}, rework{" "}
        {summary.reworkCount}, value {currentValue ?? "-"}
      </p>

      <article className="panel" id="filing-alert-retrospective-comments">
        <h3>Retrospective Comments</h3>
        <div className={styles.retrospectiveForm}>
          <label>
            Category
            <select
              value={commentCategory}
              onChange={(event) =>
                setCommentCategory(event.target.value as RetrospectiveCommentCategory)
              }
            >
              <option value="what_went_well">what_went_well</option>
              <option value="risk">risk</option>
              <option value="follow_up">follow_up</option>
            </select>
          </label>
          <label>
            Actor ID
            <input value={commentActorId} onChange={(event) => setCommentActorId(event.target.value)} />
          </label>
          <label>
            Comment
            <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} />
          </label>
          <div className={styles.retrospectiveActions}>
            <button className="btn btn-secondary btn-small" onClick={appendComment}>
              Add Comment
            </button>
            <button className="btn btn-secondary btn-small" onClick={() => setComments([])}>
              Clear Comments
            </button>
          </div>
        </div>
        {comments.length === 0 ? (
          <p className="small">No retrospective comments yet.</p>
        ) : (
          <ul className={styles.retrospectiveList} aria-label="filing retrospective comment list">
            {comments.map((entry) => (
              <li key={entry.commentId} className={styles.retrospectiveRow}>
                <p className="small">
                  <strong>{entry.category}</strong> / actor {entry.actorId} /{" "}
                  {new Date(entry.at).toLocaleString("ko-KR")}
                </p>
                <p className="small">{entry.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </article>

      <article className="panel" id="filing-alert-review-approval-grid">
        <h3>Review Approval Snapshot</h3>
        <div className={styles.approvalGrid} aria-label="filing review approval snapshot list">
          {approvals.map((entry) => {
            const draft = approvalDrafts[entry.role];
            return (
              <div key={entry.role} className={styles.approvalRow}>
                <p className="small">
                  <strong>{ROLE_LABELS[entry.role]}</strong>
                  <span className={decisionBadgeClass(entry.decision)}>{entry.decision}</span>
                </p>
                <p className="small">
                  actor {entry.actorId || "-"} / decidedAt{" "}
                  {entry.decidedAt ? new Date(entry.decidedAt).toLocaleString("ko-KR") : "-"}
                </p>
                <p className="small">{entry.note || "no note"}</p>

                <div className={styles.approvalControls}>
                  <label>
                    Decision
                    <select
                      value={draft.decision}
                      onChange={(event) =>
                        updateApprovalDraft(entry.role, "decision", event.target.value)
                      }
                    >
                      <option value="pending">pending</option>
                      <option value="approved">approved</option>
                      <option value="rework">rework</option>
                    </select>
                  </label>
                  <label>
                    Actor ID
                    <input
                      value={draft.actorId}
                      onChange={(event) => updateApprovalDraft(entry.role, "actorId", event.target.value)}
                    />
                  </label>
                  <label>
                    Note
                    <textarea
                      value={draft.note}
                      onChange={(event) => updateApprovalDraft(entry.role, "note", event.target.value)}
                    />
                  </label>
                  <button className="btn btn-secondary btn-small" onClick={() => applyDecision(entry.role)}>
                    Apply Decision
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
}
