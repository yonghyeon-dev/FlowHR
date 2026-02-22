"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerChannelPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerChannelPanel";
import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  applyClosurePacketReleaseDigestAckChannelStatus,
  applyClosurePacketReleaseDigestAckLedger,
  buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref,
  buildClosurePacketReleaseDigestAckLedgerRecord,
  buildDefaultClosurePacketReleaseDigestAckChannelEntries,
  summarizeClosurePacketReleaseDigestAckLedger,
  type ClosurePacketReleaseDigestAckChannel,
  type ClosurePacketReleaseDigestAckChannelEntry,
  type ClosurePacketReleaseDigestAckLedgerRecord
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger";
import {
  buildClosurePacketReleaseDigestAckChannelDraftMap,
  buildClosurePacketReleaseDigestAckLedgerGateState,
  CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_GATE_FIELDS,
  type ClosurePacketReleaseDigestAckChannelDraft,
  type ClosurePacketReleaseDigestAckLedgerDraft,
  type ClosurePacketReleaseDigestAckLedgerGateState
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-ui";
import { buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedger() {
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

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<ClosurePacketReleaseDigestAckLedgerGateState>(() =>
    buildClosurePacketReleaseDigestAckLedgerGateState({
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
      releaseDigestDeliveryReadyParam
    })
  );
  const [ackLedgerRecord, setAckLedgerRecord] = useState<ClosurePacketReleaseDigestAckLedgerRecord>(() =>
    buildClosurePacketReleaseDigestAckLedgerRecord({
      ledgerId: `ack-ledger-${normalizeMetric(metricParam)}`,
      status: "pending",
      ownerRole: "manager",
      ownerActorId: ownerActorIdParam ?? "",
      note: ""
    })
  );
  const [ackLedgerDraft, setAckLedgerDraft] = useState<ClosurePacketReleaseDigestAckLedgerDraft>({
    status: "pending",
    ownerRole: "manager",
    ownerActorId: ownerActorIdParam ?? "",
    note: ""
  });
  const [ackChannelEntries, setAckChannelEntries] = useState<ClosurePacketReleaseDigestAckChannelEntry[]>(() =>
    buildDefaultClosurePacketReleaseDigestAckChannelEntries()
  );
  const [ackChannelDrafts, setAckChannelDrafts] = useState<
    Record<ClosurePacketReleaseDigestAckChannel, ClosurePacketReleaseDigestAckChannelDraft>
  >(() => buildClosurePacketReleaseDigestAckChannelDraftMap(buildDefaultClosurePacketReleaseDigestAckChannelEntries()));

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultAckChannels = buildDefaultClosurePacketReleaseDigestAckChannelEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildClosurePacketReleaseDigestAckLedgerGateState({
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
        releaseDigestDeliveryReadyParam
      })
    );
    setAckLedgerRecord(
      buildClosurePacketReleaseDigestAckLedgerRecord({
        ledgerId: `ack-ledger-${normalizedMetric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: normalizedOwnerActorId,
        note: ""
      })
    );
    setAckLedgerDraft({
      status: "pending",
      ownerRole: "manager",
      ownerActorId: normalizedOwnerActorId,
      note: ""
    });
    setAckChannelEntries(defaultAckChannels);
    setAckChannelDrafts(buildClosurePacketReleaseDigestAckChannelDraftMap(defaultAckChannels));
  }, [
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
    () => summarizeClosurePacketReleaseDigestAckLedger({ ackLedgerRecord, ackChannelEntries, ...gates }),
    [ackChannelEntries, ackLedgerRecord, gates]
  );
  const releaseDigestHref = buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref({
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
    dispatchReady: gates.dispatchReady
  });
  const selfHref = buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref({
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
    releaseDigestDeliveryReady: summary.releaseDigestDeliveryReady
  });

  return (
    <section className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-hub">
      <h2>Payroll Filing Release Digest Acknowledgment Ledger</h2>
      <p className="small">
        Record acknowledgment ledger entries and reconcile channel confirmation after release digest publication.
      </p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={releaseDigestHref} className="btn btn-secondary btn-small">
          Back to Release Digest
        </Link>
        <Link href={selfHref} className="btn btn-secondary btn-small">
          Refresh Ack Ledger Context
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          ack ledger readiness
          <span className={readinessBadgeClass(summary.readyForAckLedger)}>
            {summary.readyForAckLedger ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerPanel
        ackLedgerRecord={ackLedgerRecord}
        ackLedgerDraft={ackLedgerDraft}
        onAckLedgerDraftChange={setAckLedgerDraft}
        onApplyAckLedger={() =>
          setAckLedgerRecord((prev) =>
            applyClosurePacketReleaseDigestAckLedger({
              current: prev,
              status: ackLedgerDraft.status,
              ownerRole: ackLedgerDraft.ownerRole,
              ownerActorId: ackLedgerDraft.ownerActorId,
              note: ackLedgerDraft.note
            })
          )
        }
      />

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerChannelPanel
        ackChannelEntries={ackChannelEntries}
        ackChannelDrafts={ackChannelDrafts}
        onAckChannelDraftChange={(channel, next) =>
          setAckChannelDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyAckChannel={(channel) =>
          setAckChannelEntries((prev) =>
            applyClosurePacketReleaseDigestAckChannelStatus({
              entries: prev,
              channel,
              status: ackChannelDrafts[channel].status,
              ackCode: ackChannelDrafts[channel].ackCode,
              referenceId: ackChannelDrafts[channel].referenceId,
              note: ackChannelDrafts[channel].note
            })
          )
        }
      />

      <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-readiness">
        <h3>Acknowledgment Ledger Readiness</h3>
        <div className={styles.controlGrid}>
          {CLOSURE_PACKET_RELEASE_DIGEST_ACK_LEDGER_GATE_FIELDS.map((field) => (
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
        <p className={`small ${summary.readyForAckLedger ? "ok" : "fail"}`}>
          ackLedgerVerified {summary.ackLedgerVerified ? "yes" : "no"}, reconciled{" "}
          {summary.ackChannelReconciledCount}/{summary.ackChannelTotalCount}, acknowledged{" "}
          {summary.ackChannelAcknowledgedCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Release digest acknowledgment ledger is fully ready.</p>
        ) : (
          <ul
            className={styles.blockerList}
            aria-label="filing close report closure packet release digest acknowledgment ledger blockers"
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
