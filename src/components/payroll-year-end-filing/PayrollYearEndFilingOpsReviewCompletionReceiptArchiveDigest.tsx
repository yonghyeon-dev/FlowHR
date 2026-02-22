"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsArchiveDigestPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsArchiveDigestPanel";
import PayrollYearEndFilingOpsCompletionReceiptPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsCompletionReceiptPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  applyArchiveDigestStatus,
  applyCompletionReceipt,
  buildCompletionReceiptRecord,
  buildDefaultArchiveDigestEntries,
  summarizeCompletionReceiptArchiveDigest,
  type ArchiveDigestChannel,
  type ArchiveDigestEntry,
  type CompletionReceiptRecord
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest";
import {
  buildDigestDraftMap,
  buildGateState,
  GATE_FIELDS,
  type DigestDraft,
  type GateState,
  type ReceiptDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest-ui";
import { buildRoutingSignatureDeliveryLockRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-delivery-lock-handover";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest() {
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
  const packageLockedParam = searchParams.get("packageLocked");
  const handoverAcknowledgedParam = searchParams.get("handoverAcknowledged");

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<GateState>(() =>
    buildGateState({
      handoffReadyParam,
      exportReadyParam,
      archiveReadyParam,
      routingReadyParam,
      signatureReadyParam,
      packageLockedParam,
      handoverAcknowledgedParam
    })
  );
  const [receiptRecord, setReceiptRecord] = useState<CompletionReceiptRecord>(() =>
    buildCompletionReceiptRecord({
      receiptId: `completion-receipt-${normalizeMetric(metricParam)}`,
      status: "pending",
      issuedByRole: "manager",
      issuedByActorId: ownerActorIdParam ?? "",
      note: ""
    })
  );
  const [receiptDraft, setReceiptDraft] = useState<ReceiptDraft>({
    status: "pending",
    issuedByRole: "manager",
    issuedByActorId: ownerActorIdParam ?? "",
    note: ""
  });
  const [digestEntries, setDigestEntries] = useState<ArchiveDigestEntry[]>(() =>
    buildDefaultArchiveDigestEntries()
  );
  const [digestDrafts, setDigestDrafts] = useState<Record<ArchiveDigestChannel, DigestDraft>>(() =>
    buildDigestDraftMap(buildDefaultArchiveDigestEntries())
  );

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultDigestEntries = buildDefaultArchiveDigestEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildGateState({
        handoffReadyParam,
        exportReadyParam,
        archiveReadyParam,
        routingReadyParam,
        signatureReadyParam,
        packageLockedParam,
        handoverAcknowledgedParam
      })
    );
    setReceiptRecord(
      buildCompletionReceiptRecord({
        receiptId: `completion-receipt-${normalizedMetric}`,
        status: "pending",
        issuedByRole: "manager",
        issuedByActorId: normalizedOwnerActorId,
        note: ""
      })
    );
    setReceiptDraft({
      status: "pending",
      issuedByRole: "manager",
      issuedByActorId: normalizedOwnerActorId,
      note: ""
    });
    setDigestEntries(defaultDigestEntries);
    setDigestDrafts(buildDigestDraftMap(defaultDigestEntries));
  }, [
    archiveReadyParam,
    exportReadyParam,
    handoffReadyParam,
    handoverAcknowledgedParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    packageLockedParam,
    routingReadyParam,
    signatureReadyParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const summary = useMemo(
    () => summarizeCompletionReceiptArchiveDigest({ receiptRecord, digestEntries, ...gates }),
    [digestEntries, gates, receiptRecord]
  );
  const deliveryLockHref = buildRoutingSignatureDeliveryLockRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    handoffReady: gates.handoffReady,
    exportReady: gates.exportReady,
    archiveReady: gates.archiveReady,
    routingReady: gates.routingReady,
    signatureReady: gates.signatureReady
  });

  return (
    <section className="panel" id="filing-alert-completion-receipt-archive-digest">
      <h2>Payroll Filing Completion Receipt and Archive Digest</h2>
      <p className="small">Issue completion receipts and seal archive digest channels before final closure.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={deliveryLockHref} className="btn btn-secondary btn-small">
          Back to Delivery Lock + Final Handover
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          archive digest readiness
          <span className={readinessBadgeClass(summary.readyForArchiveDigest)}>
            {summary.readyForArchiveDigest ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsCompletionReceiptPanel
        receiptRecord={receiptRecord}
        receiptDraft={receiptDraft}
        onReceiptDraftChange={setReceiptDraft}
        onApplyReceipt={() =>
          setReceiptRecord((prev) =>
            applyCompletionReceipt({
              current: prev,
              status: receiptDraft.status,
              issuedByRole: receiptDraft.issuedByRole,
              issuedByActorId: receiptDraft.issuedByActorId,
              note: receiptDraft.note
            })
          )
        }
      />

      <PayrollYearEndFilingOpsArchiveDigestPanel
        digestEntries={digestEntries}
        digestDrafts={digestDrafts}
        onDigestDraftChange={(channel, next) =>
          setDigestDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyDigestChannel={(channel) =>
          setDigestEntries((prev) =>
            applyArchiveDigestStatus({
              entries: prev,
              channel,
              status: digestDrafts[channel].status,
              artifactId: digestDrafts[channel].artifactId,
              checksum: digestDrafts[channel].checksum,
              note: digestDrafts[channel].note
            })
          )
        }
      />

      <article className="panel" id="filing-alert-completion-archive-readiness">
        <h3>Completion and Archive Readiness</h3>
        <div className={styles.controlGrid}>
          {GATE_FIELDS.map((field) => (
            <label key={field.key}>
              {field.label}
              <select
                value={gates[field.key] ? "yes" : "no"}
                onChange={(event) => setGates((prev) => ({ ...prev, [field.key]: event.target.value === "yes" }))}
              >
                <option value="yes">yes</option>
                <option value="no">no</option>
              </select>
            </label>
          ))}
        </div>
        <p className={`small ${summary.readyForArchiveDigest ? "ok" : "fail"}`}>
          receiptIssued {summary.receiptIssued ? "yes" : "no"}, receiptVerified{" "}
          {summary.receiptVerified ? "yes" : "no"}, digestSealed {summary.digestSealedCount}/
          {summary.digestTotalCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Completion receipt and archive digest are fully ready.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing completion archive blockers">
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
