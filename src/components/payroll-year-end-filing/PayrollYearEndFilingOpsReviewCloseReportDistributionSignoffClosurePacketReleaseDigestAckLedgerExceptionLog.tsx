"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionEntryPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionEntryPanel";
import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  applyClosurePacketReleaseDigestAckLedgerExceptionEntryStatus,
  applyClosurePacketReleaseDigestAckLedgerExceptionLog,
  buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref,
  buildClosurePacketReleaseDigestAckLedgerExceptionLogRecord,
  buildDefaultClosurePacketReleaseDigestAckLedgerExceptionEntries,
  summarizeClosurePacketReleaseDigestAckLedgerExceptionLog,
  type ClosurePacketReleaseDigestAckLedgerExceptionCategory,
  type ClosurePacketReleaseDigestAckLedgerExceptionEntry,
  type ClosurePacketReleaseDigestAckLedgerExceptionLogRecord
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log";
import { buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt";
import {
  buildClosurePacketReleaseDigestAckLedgerExceptionEntryDraftMap,
  buildClosurePacketReleaseDigestAckLedgerExceptionLogGateState,
  CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_LOG_GATE_FIELDS,
  type ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft,
  type ClosurePacketReleaseDigestAckLedgerExceptionLogDraft,
  type ClosurePacketReleaseDigestAckLedgerExceptionLogGateState
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-ui";
import { buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLog() {
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
  const receiptVerifiedParam = searchParams.get("receiptVerified");
  const digestReadyParam = searchParams.get("digestReady");
  const closeReportPublishedParam = searchParams.get("closeReportPublished");
  const publicationReadyParam = searchParams.get("publicationReady");
  const distributionReadyParam = searchParams.get("distributionReady");
  const signoffReadyParam = searchParams.get("signoffReady");
  const closurePacketSealedParam = searchParams.get("closurePacketSealed");
  const dispatchReadyParam = searchParams.get("dispatchReady");
  const releaseDigestPublishedParam = searchParams.get("releaseDigestPublished");
  const releaseDigestDeliveryReadyParam = searchParams.get("releaseDigestDeliveryReady");
  const ackLedgerVerifiedParam = searchParams.get("ackLedgerVerified");
  const ackChannelsReconciledParam = searchParams.get("ackChannelsReconciled");

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<ClosurePacketReleaseDigestAckLedgerExceptionLogGateState>(() =>
    buildClosurePacketReleaseDigestAckLedgerExceptionLogGateState({
      handoffReadyParam,
      exportReadyParam,
      archiveReadyParam,
      routingReadyParam,
      signatureReadyParam,
      packageLockedParam,
      handoverAcknowledgedParam,
      receiptVerifiedParam,
      digestReadyParam,
      closeReportPublishedParam,
      publicationReadyParam,
      distributionReadyParam,
      signoffReadyParam,
      closurePacketSealedParam,
      dispatchReadyParam,
      releaseDigestPublishedParam,
      releaseDigestDeliveryReadyParam,
      ackLedgerVerifiedParam,
      ackChannelsReconciledParam
    })
  );
  const [exceptionLogRecord, setExceptionLogRecord] =
    useState<ClosurePacketReleaseDigestAckLedgerExceptionLogRecord>(() =>
      buildClosurePacketReleaseDigestAckLedgerExceptionLogRecord({
        logId: `ack-exception-${normalizeMetric(metricParam)}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: ownerActorIdParam ?? "",
        summary: ""
      })
    );
  const [exceptionLogDraft, setExceptionLogDraft] =
    useState<ClosurePacketReleaseDigestAckLedgerExceptionLogDraft>({
      status: "pending",
      ownerRole: "manager",
      ownerActorId: ownerActorIdParam ?? "",
      summary: ""
    });
  const [exceptionEntries, setExceptionEntries] = useState<ClosurePacketReleaseDigestAckLedgerExceptionEntry[]>(
    () => buildDefaultClosurePacketReleaseDigestAckLedgerExceptionEntries()
  );
  const [exceptionEntryDrafts, setExceptionEntryDrafts] = useState<
    Record<
      ClosurePacketReleaseDigestAckLedgerExceptionCategory,
      ClosurePacketReleaseDigestAckLedgerExceptionEntryDraft
    >
  >(() =>
    buildClosurePacketReleaseDigestAckLedgerExceptionEntryDraftMap(
      buildDefaultClosurePacketReleaseDigestAckLedgerExceptionEntries()
    )
  );

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultExceptionEntries = buildDefaultClosurePacketReleaseDigestAckLedgerExceptionEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildClosurePacketReleaseDigestAckLedgerExceptionLogGateState({
        handoffReadyParam,
        exportReadyParam,
        archiveReadyParam,
        routingReadyParam,
        signatureReadyParam,
        packageLockedParam,
        handoverAcknowledgedParam,
        receiptVerifiedParam,
        digestReadyParam,
        closeReportPublishedParam,
        publicationReadyParam,
        distributionReadyParam,
        signoffReadyParam,
        closurePacketSealedParam,
        dispatchReadyParam,
        releaseDigestPublishedParam,
        releaseDigestDeliveryReadyParam,
        ackLedgerVerifiedParam,
        ackChannelsReconciledParam
      })
    );
    setExceptionLogRecord(
      buildClosurePacketReleaseDigestAckLedgerExceptionLogRecord({
        logId: `ack-exception-${normalizedMetric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: normalizedOwnerActorId,
        summary: ""
      })
    );
    setExceptionLogDraft({
      status: "pending",
      ownerRole: "manager",
      ownerActorId: normalizedOwnerActorId,
      summary: ""
    });
    setExceptionEntries(defaultExceptionEntries);
    setExceptionEntryDrafts(buildClosurePacketReleaseDigestAckLedgerExceptionEntryDraftMap(defaultExceptionEntries));
  }, [
    ackChannelsReconciledParam,
    ackLedgerVerifiedParam,
    archiveReadyParam,
    closeReportPublishedParam,
    closurePacketSealedParam,
    digestReadyParam,
    dispatchReadyParam,
    distributionReadyParam,
    exportReadyParam,
    handoffReadyParam,
    handoverAcknowledgedParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    packageLockedParam,
    publicationReadyParam,
    receiptVerifiedParam,
    releaseDigestDeliveryReadyParam,
    releaseDigestPublishedParam,
    routingReadyParam,
    signoffReadyParam,
    signatureReadyParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const summary = useMemo(
    () => summarizeClosurePacketReleaseDigestAckLedgerExceptionLog({ exceptionLogRecord, exceptionEntries, ...gates }),
    [exceptionEntries, exceptionLogRecord, gates]
  );
  const ackLedgerHref = buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref({
    metric,
    level,
    value: currentValue,
    ownerRole,
    ownerActorId,
    handoffReady: gates.handoffReady,
    exportReady: gates.exportReady,
    archiveReady: gates.archiveReady,
    routingReady: gates.routingReady,
    signatureReady: gates.signatureReady,
    packageLocked: gates.packageLocked,
    handoverAcknowledged: gates.handoverAcknowledged,
    receiptVerified: gates.receiptVerified,
    digestReady: gates.digestReady,
    closeReportPublished: gates.closeReportPublished,
    publicationReady: gates.publicationReady,
    distributionReady: gates.distributionReady,
    signoffReady: gates.signoffReady,
    closurePacketSealed: gates.closurePacketSealed,
    dispatchReady: gates.dispatchReady,
    releaseDigestPublished: gates.releaseDigestPublished,
    releaseDigestDeliveryReady: gates.releaseDigestDeliveryReady
  });
  const selfHref = buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref({
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
    handoverAcknowledged: summary.handoverAcknowledged,
    receiptVerified: summary.receiptVerified,
    digestReady: summary.digestReady,
    closeReportPublished: summary.closeReportPublished,
    publicationReady: summary.publicationReady,
    distributionReady: summary.distributionReady,
    signoffReady: summary.signoffReady,
    closurePacketSealed: summary.closurePacketSealed,
    dispatchReady: summary.dispatchReady,
    releaseDigestPublished: summary.releaseDigestPublished,
    releaseDigestDeliveryReady: summary.releaseDigestDeliveryReady,
    ackLedgerVerified: summary.ackLedgerVerified,
    ackChannelsReconciled: summary.ackChannelsReconciled
  });
  const closureReceiptHref =
    buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref({
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
      handoverAcknowledged: summary.handoverAcknowledged,
      receiptVerified: summary.receiptVerified,
      digestReady: summary.digestReady,
      closeReportPublished: summary.closeReportPublished,
      publicationReady: summary.publicationReady,
      distributionReady: summary.distributionReady,
      signoffReady: summary.signoffReady,
      closurePacketSealed: summary.closurePacketSealed,
      dispatchReady: summary.dispatchReady,
      releaseDigestPublished: summary.releaseDigestPublished,
      releaseDigestDeliveryReady: summary.releaseDigestDeliveryReady,
      ackLedgerVerified: summary.ackLedgerVerified,
      ackChannelsReconciled: summary.ackChannelsReconciled,
      exceptionLogClosed: summary.exceptionLogClosed,
      allExceptionsResolved: summary.allExceptionsResolved
    });

  return (
    <section className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-hub">
      <h2>Payroll Filing Ack Ledger Exception Log</h2>
      <p className="small">
        Record acknowledgment exception categories and close exception log only when all categories are resolved.
      </p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={ackLedgerHref} className="btn btn-secondary btn-small">
          Back to Ack Ledger
        </Link>
        <Link href={closureReceiptHref} className="btn btn-secondary btn-small">
          Open Exception Closure Receipt
        </Link>
        <Link href={selfHref} className="btn btn-secondary btn-small">
          Refresh Exception Context
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          exception closure readiness
          <span className={readinessBadgeClass(summary.readyForExceptionClosure)}>
            {summary.readyForExceptionClosure ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogPanel
        exceptionLogRecord={exceptionLogRecord}
        exceptionLogDraft={exceptionLogDraft}
        onExceptionLogDraftChange={setExceptionLogDraft}
        onApplyExceptionLog={() =>
          setExceptionLogRecord((prev) =>
            applyClosurePacketReleaseDigestAckLedgerExceptionLog({
              current: prev,
              status: exceptionLogDraft.status,
              ownerRole: exceptionLogDraft.ownerRole,
              ownerActorId: exceptionLogDraft.ownerActorId,
              summary: exceptionLogDraft.summary
            })
          )
        }
      />

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionEntryPanel
        exceptionEntries={exceptionEntries}
        exceptionEntryDrafts={exceptionEntryDrafts}
        onExceptionEntryDraftChange={(category, next) =>
          setExceptionEntryDrafts((prev) => ({
            ...prev,
            [category]: next
          }))
        }
        onApplyExceptionEntry={(category) =>
          setExceptionEntries((prev) =>
            applyClosurePacketReleaseDigestAckLedgerExceptionEntryStatus({
              entries: prev,
              category,
              status: exceptionEntryDrafts[category].status,
              incidentId: exceptionEntryDrafts[category].incidentId,
              referenceId: exceptionEntryDrafts[category].referenceId,
              note: exceptionEntryDrafts[category].note
            })
          )
        }
      />

      <article
        className="panel"
        id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-readiness"
      >
        <h3>Exception Closure Readiness</h3>
        <div className={styles.controlGrid}>
          {CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_EXCEPTION_LOG_GATE_FIELDS.map((field) => (
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
        <p className={`small ${summary.readyForExceptionClosure ? "ok" : "fail"}`}>
          exceptionLogClosed {summary.exceptionLogClosed ? "yes" : "no"}, resolved{" "}
          {summary.exceptionResolvedCount}/{summary.exceptionTotalCount}, investigating{" "}
          {summary.exceptionInvestigatingCount}, open {summary.exceptionOpenCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Acknowledgment exception log is fully closed.</p>
        ) : (
          <ul
            className={styles.blockerList}
            aria-label="filing close report closure packet release digest ack ledger exception log blockers"
          >
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
