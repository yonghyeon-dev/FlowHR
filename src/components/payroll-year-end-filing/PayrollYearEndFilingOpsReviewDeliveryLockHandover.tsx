"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewDeliveryLockHandover.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { parseBooleanQueryParam } from "@/components/payroll-year-end-filing/filing-alert-review-close-off-package";
import {
  applyDeliveryPackageLock,
  applyFinalHandoverStatus,
  buildDeliveryPackageLockEntry,
  buildFinalHandoverRecord,
  summarizeDeliveryLockHandover,
  type DeliveryPackageLockEntry,
  type DeliveryPackageLockStatus,
  type FinalHandoverChannel,
  type FinalHandoverRecord,
  type FinalHandoverStatus
} from "@/components/payroll-year-end-filing/filing-alert-review-delivery-lock-handover";
import { buildDeliveryLockCompletionReceiptRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest";
import { buildCloseOffRoutingSignatureBundleRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-routing-signature-bundle";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

type LockDraft = {
  status: DeliveryPackageLockStatus;
  lockedByRole: ReviewHandoffRole;
  lockedByActorId: string;
  lockReason: string;
  releaseNote: string;
};

type HandoverDraft = {
  status: FinalHandoverStatus;
  targetRole: ReviewHandoffRole;
  targetActorId: string;
  channel: FinalHandoverChannel;
  note: string;
};

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

function lockStatusBadgeClass(status: DeliveryPackageLockStatus) {
  if (status === "locked") {
    return `${styles.stateBadge} ${styles.stateLocked}`;
  }
  if (status === "released") {
    return `${styles.stateBadge} ${styles.stateReleased}`;
  }
  return `${styles.stateBadge} ${styles.stateDraft}`;
}

function handoverStatusBadgeClass(status: FinalHandoverStatus) {
  if (status === "acknowledged") {
    return `${styles.stateBadge} ${styles.stateAck}`;
  }
  if (status === "handover_sent") {
    return `${styles.stateBadge} ${styles.stateSent}`;
  }
  return `${styles.stateBadge} ${styles.stateDraft}`;
}

export default function PayrollYearEndFilingOpsReviewDeliveryLockHandover() {
  const searchParams = useSearchParams();

  const metricParam = searchParams.get("metric");
  const levelParam = searchParams.get("level");
  const ownerRoleParam = searchParams.get("ownerRole");
  const ownerActorIdParam = searchParams.get("ownerActorId");
  const valueParam = searchParams.get("value");
  const handoffReadyParam = searchParams.get("handoffReady");
  const exportReadyParam = searchParams.get("exportReady");
  const archiveReadyParam = searchParams.get("archiveReady");
  const routingReadyParam = searchParams.get("routingReady");
  const signatureReadyParam = searchParams.get("signatureReady");

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [handoffReady, setHandoffReady] = useState(() => parseBooleanQueryParam(handoffReadyParam));
  const [exportReady, setExportReady] = useState(() => parseBooleanQueryParam(exportReadyParam));
  const [archiveReady, setArchiveReady] = useState(() => parseBooleanQueryParam(archiveReadyParam));
  const [routingReady, setRoutingReady] = useState(() => parseBooleanQueryParam(routingReadyParam));
  const [signatureReady, setSignatureReady] = useState(() => parseBooleanQueryParam(signatureReadyParam));
  const [lockEntry, setLockEntry] = useState<DeliveryPackageLockEntry>(() =>
    buildDeliveryPackageLockEntry({
      packageId: `delivery-package-${normalizeMetric(metricParam)}`,
      status: "draft",
      lockedByRole: "manager",
      lockedByActorId: ownerActorIdParam ?? "",
      lockReason: "",
      releaseNote: ""
    })
  );
  const [handoverRecord, setHandoverRecord] = useState<FinalHandoverRecord>(() =>
    buildFinalHandoverRecord({
      targetRole: "manager",
      targetActorId: "",
      status: "pending",
      channel: "ops_note",
      note: ""
    })
  );
  const [lockDraft, setLockDraft] = useState<LockDraft>({
    status: "draft",
    lockedByRole: "manager",
    lockedByActorId: ownerActorIdParam ?? "",
    lockReason: "",
    releaseNote: ""
  });
  const [handoverDraft, setHandoverDraft] = useState<HandoverDraft>({
    status: "pending",
    targetRole: "manager",
    targetActorId: "",
    channel: "ops_note",
    note: ""
  });

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setHandoffReady(parseBooleanQueryParam(handoffReadyParam));
    setExportReady(parseBooleanQueryParam(exportReadyParam));
    setArchiveReady(parseBooleanQueryParam(archiveReadyParam));
    setRoutingReady(parseBooleanQueryParam(routingReadyParam));
    setSignatureReady(parseBooleanQueryParam(signatureReadyParam));

    setLockEntry(
      buildDeliveryPackageLockEntry({
        packageId: `delivery-package-${normalizedMetric}`,
        status: "draft",
        lockedByRole: "manager",
        lockedByActorId: normalizedOwnerActorId,
        lockReason: "",
        releaseNote: ""
      })
    );
    setHandoverRecord(
      buildFinalHandoverRecord({
        targetRole: "manager",
        targetActorId: "",
        status: "pending",
        channel: "ops_note",
        note: ""
      })
    );
    setLockDraft({
      status: "draft",
      lockedByRole: "manager",
      lockedByActorId: normalizedOwnerActorId,
      lockReason: "",
      releaseNote: ""
    });
    setHandoverDraft({
      status: "pending",
      targetRole: "manager",
      targetActorId: "",
      channel: "ops_note",
      note: ""
    });
  }, [
    archiveReadyParam,
    exportReadyParam,
    handoffReadyParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    routingReadyParam,
    signatureReadyParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const routingSignatureHref = buildCloseOffRoutingSignatureBundleRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    handoffReady,
    exportReady,
    archiveReady
  });

  const summary = useMemo(
    () =>
      summarizeDeliveryLockHandover({
        lockEntry,
        handoverRecord,
        handoffReady,
        exportReady,
        archiveReady,
        routingReady,
        signatureReady
      }),
    [lockEntry, handoverRecord, handoffReady, exportReady, archiveReady, routingReady, signatureReady]
  );
  const completionReceiptHref = buildDeliveryLockCompletionReceiptRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    handoffReady: summary.handoffReady,
    exportReady: summary.exportReady,
    archiveReady: summary.archiveReady,
    routingReady: summary.routingReady,
    signatureReady: summary.signatureReady,
    packageLocked: summary.packageLocked,
    handoverAcknowledged: summary.handoverAcknowledged
  });

  function applyLock() {
    setLockEntry((prev) =>
      applyDeliveryPackageLock({
        current: prev,
        status: lockDraft.status,
        lockedByRole: lockDraft.lockedByRole,
        lockedByActorId: lockDraft.lockedByActorId,
        lockReason: lockDraft.lockReason,
        releaseNote: lockDraft.releaseNote
      })
    );
  }

  function applyHandover() {
    setHandoverRecord((prev) =>
      applyFinalHandoverStatus({
        current: prev,
        status: handoverDraft.status,
        targetRole: handoverDraft.targetRole,
        targetActorId: handoverDraft.targetActorId,
        channel: handoverDraft.channel,
        note: handoverDraft.note
      })
    );
  }

  return (
    <section className="panel" id="filing-alert-delivery-lock-handover">
      <h2>Payroll Filing Delivery Package Lock and Final Handover</h2>
      <p className="small">Lock the delivery package and confirm final handover acknowledgment.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={routingSignatureHref} className="btn btn-secondary btn-small">
          Back to Routing + Signature Bundle
        </Link>
        <Link href={completionReceiptHref} className="btn btn-secondary btn-small">
          Open Completion Receipt + Archive Digest
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          completion readiness
          <span className={readinessBadgeClass(summary.readyForCompletion)}>
            {summary.readyForCompletion ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <article className="panel" id="filing-alert-delivery-package-lock">
        <h3>Delivery Package Lock</h3>
        <div className={styles.sectionGrid}>
          <div className={styles.card}>
            <p className="small">
              package {lockEntry.packageId}
              <span className={lockStatusBadgeClass(lockEntry.status)}>{lockEntry.status}</span>
            </p>
            <p className="small">
              by {lockEntry.lockedByRole}:{lockEntry.lockedByActorId || "-"} / lockedAt{" "}
              {lockEntry.lockedAt ? new Date(lockEntry.lockedAt).toLocaleString("ko-KR") : "-"}
            </p>
            <p className="small">lock reason {lockEntry.lockReason || "-"}</p>
            <p className="small">release note {lockEntry.releaseNote || "-"}</p>
          </div>
          <div className={styles.controlGrid}>
            <label>
              Lock Status
              <select
                value={lockDraft.status}
                onChange={(event) =>
                  setLockDraft((prev) => ({ ...prev, status: event.target.value as DeliveryPackageLockStatus }))
                }
              >
                <option value="draft">draft</option>
                <option value="locked">locked</option>
                <option value="released">released</option>
              </select>
            </label>
            <label>
              Locked By Role
              <select
                value={lockDraft.lockedByRole}
                onChange={(event) =>
                  setLockDraft((prev) => ({ ...prev, lockedByRole: event.target.value as ReviewHandoffRole }))
                }
              >
                <option value="payroll_operator">payroll_operator</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Locked By Actor ID
              <input
                value={lockDraft.lockedByActorId}
                onChange={(event) =>
                  setLockDraft((prev) => ({ ...prev, lockedByActorId: event.target.value }))
                }
              />
            </label>
            <label>
              Lock Reason
              <textarea
                value={lockDraft.lockReason}
                onChange={(event) => setLockDraft((prev) => ({ ...prev, lockReason: event.target.value }))}
              />
            </label>
            <label>
              Release Note
              <textarea
                value={lockDraft.releaseNote}
                onChange={(event) => setLockDraft((prev) => ({ ...prev, releaseNote: event.target.value }))}
              />
            </label>
          </div>
          <button className="btn btn-secondary btn-small" onClick={applyLock}>
            Apply Delivery Lock
          </button>
        </div>
      </article>

      <article className="panel" id="filing-alert-final-handover">
        <h3>Final Handover</h3>
        <div className={styles.sectionGrid}>
          <div className={styles.card}>
            <p className="small">
              target {handoverRecord.targetRole}:{handoverRecord.targetActorId || "-"}
              <span className={handoverStatusBadgeClass(handoverRecord.status)}>{handoverRecord.status}</span>
            </p>
            <p className="small">
              channel {handoverRecord.channel} / sentAt {handoverRecord.sentAt || "-"} / ackAt{" "}
              {handoverRecord.acknowledgedAt || "-"}
            </p>
            <p className="small">{handoverRecord.note || "no handover note"}</p>
          </div>
          <div className={styles.controlGrid}>
            <label>
              Handover Status
              <select
                value={handoverDraft.status}
                onChange={(event) =>
                  setHandoverDraft((prev) => ({ ...prev, status: event.target.value as FinalHandoverStatus }))
                }
              >
                <option value="pending">pending</option>
                <option value="handover_sent">handover_sent</option>
                <option value="acknowledged">acknowledged</option>
              </select>
            </label>
            <label>
              Target Role
              <select
                value={handoverDraft.targetRole}
                onChange={(event) =>
                  setHandoverDraft((prev) => ({ ...prev, targetRole: event.target.value as ReviewHandoffRole }))
                }
              >
                <option value="payroll_operator">payroll_operator</option>
                <option value="manager">manager</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Target Actor ID
              <input
                value={handoverDraft.targetActorId}
                onChange={(event) =>
                  setHandoverDraft((prev) => ({ ...prev, targetActorId: event.target.value }))
                }
              />
            </label>
            <label>
              Channel
              <select
                value={handoverDraft.channel}
                onChange={(event) =>
                  setHandoverDraft((prev) => ({ ...prev, channel: event.target.value as FinalHandoverChannel }))
                }
              >
                <option value="ops_note">ops_note</option>
                <option value="hometax_bundle">hometax_bundle</option>
                <option value="internal_audit">internal_audit</option>
              </select>
            </label>
            <label>
              Note
              <textarea
                value={handoverDraft.note}
                onChange={(event) => setHandoverDraft((prev) => ({ ...prev, note: event.target.value }))}
              />
            </label>
          </div>
          <button className="btn btn-secondary btn-small" onClick={applyHandover}>
            Apply Final Handover
          </button>
        </div>
      </article>

      <article className="panel" id="filing-alert-delivery-lock-readiness">
        <h3>Delivery Completion Readiness</h3>
        <div className={styles.controlGrid}>
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
          <label>
            Archive Ready
            <select value={archiveReady ? "yes" : "no"} onChange={(event) => setArchiveReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label>
            Routing Ready
            <select value={routingReady ? "yes" : "no"} onChange={(event) => setRoutingReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
          <label>
            Signature Ready
            <select value={signatureReady ? "yes" : "no"} onChange={(event) => setSignatureReady(event.target.value === "yes")}>
              <option value="yes">yes</option>
              <option value="no">no</option>
            </select>
          </label>
        </div>
        <p className={`small ${summary.readyForCompletion ? "ok" : "fail"}`}>
          packageLocked {summary.packageLocked ? "yes" : "no"}, handoverSent {summary.handoverSent ? "yes" : "no"},
          handoverAck {summary.handoverAcknowledged ? "yes" : "no"}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Delivery package lock and final handover are fully complete.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing delivery lock blockers">
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
