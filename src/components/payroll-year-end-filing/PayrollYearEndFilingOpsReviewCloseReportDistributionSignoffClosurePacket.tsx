"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsClosurePacketDispatchPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketDispatchPanel";
import PayrollYearEndFilingOpsClosurePacketPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildCloseReportDistributionSignoffRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff";
import {
  applyClosurePacket,
  applyClosurePacketDispatchStatus,
  buildClosurePacketRecord,
  buildDefaultClosurePacketDispatchEntries,
  summarizeCloseReportDistributionSignoffClosurePacket,
  type CloseReportDistributionSignoffClosurePacketRecord,
  type ClosurePacketDispatchChannel,
  type ClosurePacketDispatchEntry
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet";
import { buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest";
import {
  buildClosurePacketDispatchDraftMap,
  buildCloseReportDistributionSignoffClosurePacketGateState,
  CLOSE_REPORT_DISTRIBUTION_SIGNOFF_CLOSURE_PACKET_GATE_FIELDS,
  type ClosurePacketDispatchDraft,
  type ClosurePacketDraft,
  type CloseReportDistributionSignoffClosurePacketGateState
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-ui";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacket() {
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

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<CloseReportDistributionSignoffClosurePacketGateState>(() =>
    buildCloseReportDistributionSignoffClosurePacketGateState({
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
      signoffReadyParam
    })
  );
  const [closurePacketRecord, setClosurePacketRecord] =
    useState<CloseReportDistributionSignoffClosurePacketRecord>(() =>
      buildClosurePacketRecord({
        packetId: `closure-packet-${normalizeMetric(metricParam)}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: ownerActorIdParam ?? "",
        summary: ""
      })
    );
  const [closurePacketDraft, setClosurePacketDraft] = useState<ClosurePacketDraft>({
    status: "pending",
    ownerRole: "manager",
    ownerActorId: ownerActorIdParam ?? "",
    summary: ""
  });
  const [dispatchEntries, setDispatchEntries] = useState<ClosurePacketDispatchEntry[]>(() =>
    buildDefaultClosurePacketDispatchEntries()
  );
  const [dispatchDrafts, setDispatchDrafts] = useState<
    Record<ClosurePacketDispatchChannel, ClosurePacketDispatchDraft>
  >(() => buildClosurePacketDispatchDraftMap(buildDefaultClosurePacketDispatchEntries()));

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultDispatchEntries = buildDefaultClosurePacketDispatchEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildCloseReportDistributionSignoffClosurePacketGateState({
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
        signoffReadyParam
      })
    );
    setClosurePacketRecord(
      buildClosurePacketRecord({
        packetId: `closure-packet-${normalizedMetric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: normalizedOwnerActorId,
        summary: ""
      })
    );
    setClosurePacketDraft({
      status: "pending",
      ownerRole: "manager",
      ownerActorId: normalizedOwnerActorId,
      summary: ""
    });
    setDispatchEntries(defaultDispatchEntries);
    setDispatchDrafts(buildClosurePacketDispatchDraftMap(defaultDispatchEntries));
  }, [
    archiveReadyParam,
    closeReportPublishedParam,
    digestReadyParam,
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
    routingReadyParam,
    signatureReadyParam,
    signoffReadyParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const summary = useMemo(
    () =>
      summarizeCloseReportDistributionSignoffClosurePacket({
        closurePacketRecord,
        dispatchEntries,
        ...gates
      }),
    [closurePacketRecord, dispatchEntries, gates]
  );
  const distributionSignoffHref = buildCloseReportDistributionSignoffRouteHref({
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
    publicationReady: gates.publicationReady
  });
  const releaseDigestHref = buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref({
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
    dispatchReady: summary.dispatchReady
  });

  return (
    <section className="panel" id="filing-alert-close-report-distribution-signoff-closure-packet-hub">
      <h2>Payroll Filing Distribution Sign-off Closure Packet</h2>
      <p className="small">Seal the final closure packet and dispatch archives after distribution sign-off.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={distributionSignoffHref} className="btn btn-secondary btn-small">
          Back to Distribution Sign-off
        </Link>
        <Link href={releaseDigestHref} className="btn btn-secondary btn-small">
          Open Release Digest
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          closure packet readiness
          <span className={readinessBadgeClass(summary.readyForClosurePacket)}>
            {summary.readyForClosurePacket ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsClosurePacketPanel
        closurePacketRecord={closurePacketRecord}
        closurePacketDraft={closurePacketDraft}
        onClosurePacketDraftChange={setClosurePacketDraft}
        onApplyClosurePacket={() =>
          setClosurePacketRecord((prev) =>
            applyClosurePacket({
              current: prev,
              status: closurePacketDraft.status,
              ownerRole: closurePacketDraft.ownerRole,
              ownerActorId: closurePacketDraft.ownerActorId,
              summary: closurePacketDraft.summary
            })
          )
        }
      />

      <PayrollYearEndFilingOpsClosurePacketDispatchPanel
        dispatchEntries={dispatchEntries}
        dispatchDrafts={dispatchDrafts}
        onDispatchDraftChange={(channel, next) =>
          setDispatchDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyDispatchChannel={(channel) =>
          setDispatchEntries((prev) =>
            applyClosurePacketDispatchStatus({
              entries: prev,
              channel,
              status: dispatchDrafts[channel].status,
              artifactId: dispatchDrafts[channel].artifactId,
              checksum: dispatchDrafts[channel].checksum,
              note: dispatchDrafts[channel].note
            })
          )
        }
      />

      <article className="panel" id="filing-alert-close-report-distribution-signoff-closure-packet-readiness">
        <h3>Closure Packet Readiness</h3>
        <div className={styles.controlGrid}>
          {CLOSE_REPORT_DISTRIBUTION_SIGNOFF_CLOSURE_PACKET_GATE_FIELDS.map((field) => (
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
        <p className={`small ${summary.readyForClosurePacket ? "ok" : "fail"}`}>
          closurePacketSealed {summary.closurePacketSealed ? "yes" : "no"}, dispatchReleased{" "}
          {summary.dispatchReleasedCount}/{summary.dispatchTotalCount}, dispatchPrepared{" "}
          {summary.dispatchPreparedCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Distribution sign-off closure packet is fully ready.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing close report distribution signoff closure packet blockers">
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
