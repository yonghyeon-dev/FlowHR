"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCloseOffPackage.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildChecklistReviewSnapshotRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-approval-snapshot";
import { buildReviewSnapshotHandoffRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";
import {
  applyAuditSignOffDecision,
  buildDefaultAuditSignOffEntries,
  parseBooleanQueryParam,
  summarizeCloseOffPackage,
  type AuditSignOffEntry,
  type AuditSignOffStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type SignOffDraft = {
  status: AuditSignOffStatus;
  actorId: string;
  note: string;
};

const ROLE_LABELS: Record<ReviewHandoffRole, string> = {
  payroll_operator: "Payroll Operator",
  manager: "Manager",
  admin: "Admin"
};

function copySignOffEntries(entries: readonly AuditSignOffEntry[]) {
  return entries.map((entry) => ({ ...entry }));
}

function buildDraftMap(entries: readonly AuditSignOffEntry[]) {
  return {
    payroll_operator: {
      status: entries.find((entry) => entry.role === "payroll_operator")?.status ?? "pending",
      actorId: entries.find((entry) => entry.role === "payroll_operator")?.actorId ?? "",
      note: entries.find((entry) => entry.role === "payroll_operator")?.note ?? ""
    },
    manager: {
      status: entries.find((entry) => entry.role === "manager")?.status ?? "pending",
      actorId: entries.find((entry) => entry.role === "manager")?.actorId ?? "",
      note: entries.find((entry) => entry.role === "manager")?.note ?? ""
    },
    admin: {
      status: entries.find((entry) => entry.role === "admin")?.status ?? "pending",
      actorId: entries.find((entry) => entry.role === "admin")?.actorId ?? "",
      note: entries.find((entry) => entry.role === "admin")?.note ?? ""
    }
  } satisfies Record<ReviewHandoffRole, SignOffDraft>;
}

function badgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

function signOffBadgeClass(status: AuditSignOffStatus) {
  if (status === "signed") {
    return `${styles.decisionBadge} ${styles.decisionSigned}`;
  }
  if (status === "rejected") {
    return `${styles.decisionBadge} ${styles.decisionRejected}`;
  }
  return `${styles.decisionBadge} ${styles.decisionPending}`;
}

export default function PayrollYearEndFilingOpsReviewCloseOffPackage() {
  const searchParams = useSearchParams();

  const metricParam = searchParams.get("metric");
  const levelParam = searchParams.get("level");
  const ownerRoleParam = searchParams.get("ownerRole");
  const ownerActorIdParam = searchParams.get("ownerActorId");
  const valueParam = searchParams.get("value");
  const handoffReadyParam = searchParams.get("handoffReady");
  const exportReadyParam = searchParams.get("exportReady");

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [handoffReady, setHandoffReady] = useState(() => parseBooleanQueryParam(handoffReadyParam));
  const [exportReady, setExportReady] = useState(() => parseBooleanQueryParam(exportReadyParam));
  const [signOffEntries, setSignOffEntries] = useState<AuditSignOffEntry[]>(() =>
    buildDefaultAuditSignOffEntries(ownerActorIdParam ?? "")
  );
  const [signOffDrafts, setSignOffDrafts] = useState<Record<ReviewHandoffRole, SignOffDraft>>(() =>
    buildDraftMap(buildDefaultAuditSignOffEntries(ownerActorIdParam ?? ""))
  );
  const [archiveBundleId, setArchiveBundleId] = useState(() => `close-off-${normalizeMetric(metricParam)}`);
  const [archiveNote, setArchiveNote] = useState("");

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultEntries = buildDefaultAuditSignOffEntries(normalizedOwnerActorId);

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setHandoffReady(parseBooleanQueryParam(handoffReadyParam));
    setExportReady(parseBooleanQueryParam(exportReadyParam));
    setSignOffEntries(copySignOffEntries(defaultEntries));
    setSignOffDrafts(buildDraftMap(defaultEntries));
    setArchiveBundleId(`close-off-${normalizedMetric}`);
    setArchiveNote("");
  }, [
    exportReadyParam,
    handoffReadyParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const approvalSnapshotHref = buildChecklistReviewSnapshotRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId
  });
  const handoffSnapshotHref = buildReviewSnapshotHandoffRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    approvedCount: 0,
    pendingCount: 0,
    reworkCount: 0,
    totalCount: 0
  });

  const summary = useMemo(
    () =>
      summarizeCloseOffPackage({
        entries: signOffEntries,
        handoffReady,
        exportReady
      }),
    [signOffEntries, handoffReady, exportReady]
  );

  function updateSignOffDraft(role: ReviewHandoffRole, key: keyof SignOffDraft, value: string) {
    setSignOffDrafts((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [key]: value
      }
    }));
  }

  function applySignOff(role: ReviewHandoffRole) {
    const draft = signOffDrafts[role];
    setSignOffEntries((prev) =>
      applyAuditSignOffDecision({
        entries: prev,
        role,
        status: draft.status,
        actorId: draft.actorId,
        note: draft.note
      })
    );
  }

  return (
    <section className="panel" id="filing-alert-review-close-off-package">
      <h2>Payroll Filing Review Close-off Package</h2>
      <p className="small">Finalize audit sign-off before archival close-off.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={approvalSnapshotHref} className="btn btn-secondary btn-small">
          Back to Approval Snapshot
        </Link>
        <Link href={handoffSnapshotHref} className="btn btn-secondary btn-small">
          Back to Handoff Snapshot
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          archive readiness
          <span className={badgeClass(summary.readyToArchive)}>{summary.readyToArchive ? "ready" : "hold"}</span>
        </p>
      </div>

      <article className="panel" id="filing-alert-audit-signoff-grid">
        <h3>Audit Sign-off Grid</h3>
        <div className={styles.signOffGrid} aria-label="filing audit signoff grid">
          {signOffEntries.map((entry) => {
            const draft = signOffDrafts[entry.role];
            return (
              <div key={entry.role} className={styles.signOffRow}>
                <p className="small">
                  <strong>{ROLE_LABELS[entry.role]}</strong>
                  <span className={signOffBadgeClass(entry.status)}>{entry.status}</span>
                </p>
                <p className="small">
                  actor {entry.actorId || "-"} / signedAt{" "}
                  {entry.signedAt ? new Date(entry.signedAt).toLocaleString("ko-KR") : "-"}
                </p>
                <p className="small">{entry.note || "no sign-off note"}</p>

                <div className={styles.controlGrid}>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(event) => updateSignOffDraft(entry.role, "status", event.target.value)}
                    >
                      <option value="pending">pending</option>
                      <option value="signed">signed</option>
                      <option value="rejected">rejected</option>
                    </select>
                  </label>
                  <label>
                    Actor ID
                    <input
                      value={draft.actorId}
                      onChange={(event) => updateSignOffDraft(entry.role, "actorId", event.target.value)}
                    />
                  </label>
                  <label>
                    Note
                    <textarea
                      value={draft.note}
                      onChange={(event) => updateSignOffDraft(entry.role, "note", event.target.value)}
                    />
                  </label>
                </div>
                <button className="btn btn-secondary btn-small" onClick={() => applySignOff(entry.role)}>
                  Apply Sign-off
                </button>
              </div>
            );
          })}
        </div>
      </article>

      <article className="panel" id="filing-alert-close-off-package-archive">
        <h3>Close-off Package Archive</h3>
        <div className={styles.controlGrid}>
          <label>
            Archive Bundle ID
            <input value={archiveBundleId} onChange={(event) => setArchiveBundleId(event.target.value)} />
          </label>
          <label>
            Handoff Ready
            <select value={handoffReady ? "yes" : "no"} onChange={(event) => setHandoffReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label>
            Export Ready
            <select value={exportReady ? "yes" : "no"} onChange={(event) => setExportReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
        </div>
        <label>
          Archive Note
          <textarea value={archiveNote} onChange={(event) => setArchiveNote(event.target.value)} />
        </label>
        <div className={styles.archiveCard}>
          <p className="small">bundle {archiveBundleId || "-"}</p>
          <p className="small">
            handoff {summary.handoffReady ? "ready" : "hold"} / export {summary.exportReady ? "ready" : "hold"}
          </p>
          <p className="small">audit signed {summary.signedCount}/{summary.totalCount}</p>
          <p className="small">{archiveNote.trim() || "no archive note"}</p>
        </div>
      </article>

      <article className="panel" id="filing-alert-close-off-readiness">
        <h3>Close-off Readiness</h3>
        <p className={`small ${summary.readyToArchive ? "ok" : "fail"}`}>
          signed {summary.signedCount}/{summary.totalCount}, pending {summary.pendingCount}, rejected{" "}
          {summary.rejectedCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">All close-off gates are clear. Archive package is ready.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing close-off blockers">
            {summary.blockers.map((blocker) => (
              <li key={blocker} className="small">
                {blocker}
              </li>
            ))}
          </ul>
        )}
      </article>
    </section>
  );
}
