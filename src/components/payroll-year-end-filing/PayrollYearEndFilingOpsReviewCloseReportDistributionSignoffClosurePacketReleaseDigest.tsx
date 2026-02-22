"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsClosurePacketReleaseDigestChannelPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestChannelPanel";
import PayrollYearEndFilingOpsClosurePacketReleaseDigestPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildCloseReportDistributionSignoffClosurePacketRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet";
import {
  applyClosurePacketReleaseDigest,
  applyClosurePacketReleaseDigestChannelStatus,
  buildClosurePacketReleaseDigestRecord,
  buildDefaultClosurePacketReleaseDigestChannelEntries,
  summarizeClosurePacketReleaseDigest,
  type ClosurePacketReleaseDigestChannel,
  type ClosurePacketReleaseDigestChannelEntry,
  type ClosurePacketReleaseDigestRecord
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest";
import {
  buildClosurePacketReleaseDigestChannelDraftMap,
  buildClosurePacketReleaseDigestGateState,
  CLOSURE_PACKET_RELEASE_DIGEST_GATE_FIELDS,
  type ClosurePacketReleaseDigestChannelDraft,
  type ClosurePacketReleaseDigestDraft,
  type ClosurePacketReleaseDigestGateState
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ui";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigest() {
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

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<ClosurePacketReleaseDigestGateState>(() =>
    buildClosurePacketReleaseDigestGateState({
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
      dispatchReadyParam
    })
  );
  const [releaseDigestRecord, setReleaseDigestRecord] = useState<ClosurePacketReleaseDigestRecord>(() =>
    buildClosurePacketReleaseDigestRecord({
      digestId: `release-digest-${normalizeMetric(metricParam)}`,
      status: "pending",
      ownerRole: "manager",
      ownerActorId: ownerActorIdParam ?? "",
      summary: ""
    })
  );
  const [releaseDigestDraft, setReleaseDigestDraft] = useState<ClosurePacketReleaseDigestDraft>({
    status: "pending",
    ownerRole: "manager",
    ownerActorId: ownerActorIdParam ?? "",
    summary: ""
  });
  const [releaseDigestChannelEntries, setReleaseDigestChannelEntries] = useState<
    ClosurePacketReleaseDigestChannelEntry[]
  >(() => buildDefaultClosurePacketReleaseDigestChannelEntries());
  const [releaseDigestChannelDrafts, setReleaseDigestChannelDrafts] = useState<
    Record<ClosurePacketReleaseDigestChannel, ClosurePacketReleaseDigestChannelDraft>
  >(() =>
    buildClosurePacketReleaseDigestChannelDraftMap(buildDefaultClosurePacketReleaseDigestChannelEntries())
  );

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultReleaseDigestChannels = buildDefaultClosurePacketReleaseDigestChannelEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildClosurePacketReleaseDigestGateState({
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
        dispatchReadyParam
      })
    );
    setReleaseDigestRecord(
      buildClosurePacketReleaseDigestRecord({
        digestId: `release-digest-${normalizedMetric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: normalizedOwnerActorId,
        summary: ""
      })
    );
    setReleaseDigestDraft({
      status: "pending",
      ownerRole: "manager",
      ownerActorId: normalizedOwnerActorId,
      summary: ""
    });
    setReleaseDigestChannelEntries(defaultReleaseDigestChannels);
    setReleaseDigestChannelDrafts(buildClosurePacketReleaseDigestChannelDraftMap(defaultReleaseDigestChannels));
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
    routingReadyParam,
    signoffReadyParam,
    signatureReadyParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const summary = useMemo(
    () => summarizeClosurePacketReleaseDigest({ releaseDigestRecord, releaseDigestChannelEntries, ...gates }),
    [gates, releaseDigestChannelEntries, releaseDigestRecord]
  );
  const closurePacketHref = buildCloseReportDistributionSignoffClosurePacketRouteHref({
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
    signoffReady: gates.signoffReady
  });

  return (
    <section className="panel" id="filing-alert-close-report-closure-packet-release-digest-hub">
      <h2>Payroll Filing Closure Packet Release Digest</h2>
      <p className="small">Publish release digest and complete digest channel delivery after closure packet sealing.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={closurePacketHref} className="btn btn-secondary btn-small">
          Back to Closure Packet
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          release digest readiness
          <span className={readinessBadgeClass(summary.readyForReleaseDigest)}>
            {summary.readyForReleaseDigest ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestPanel
        releaseDigestRecord={releaseDigestRecord}
        releaseDigestDraft={releaseDigestDraft}
        onReleaseDigestDraftChange={setReleaseDigestDraft}
        onApplyReleaseDigest={() =>
          setReleaseDigestRecord((prev) =>
            applyClosurePacketReleaseDigest({
              current: prev,
              status: releaseDigestDraft.status,
              ownerRole: releaseDigestDraft.ownerRole,
              ownerActorId: releaseDigestDraft.ownerActorId,
              summary: releaseDigestDraft.summary
            })
          )
        }
      />

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestChannelPanel
        releaseDigestChannelEntries={releaseDigestChannelEntries}
        releaseDigestChannelDrafts={releaseDigestChannelDrafts}
        onReleaseDigestChannelDraftChange={(channel, next) =>
          setReleaseDigestChannelDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyReleaseDigestChannel={(channel) =>
          setReleaseDigestChannelEntries((prev) =>
            applyClosurePacketReleaseDigestChannelStatus({
              entries: prev,
              channel,
              status: releaseDigestChannelDrafts[channel].status,
              artifactId: releaseDigestChannelDrafts[channel].artifactId,
              referenceId: releaseDigestChannelDrafts[channel].referenceId,
              note: releaseDigestChannelDrafts[channel].note
            })
          )
        }
      />

      <article className="panel" id="filing-alert-close-report-closure-packet-release-digest-readiness">
        <h3>Release Digest Readiness</h3>
        <div className={styles.controlGrid}>
          {CLOSURE_PACKET_RELEASE_DIGEST_GATE_FIELDS.map((field) => (
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
        <p className={`small ${summary.readyForReleaseDigest ? "ok" : "fail"}`}>
          releaseDigestPublished {summary.releaseDigestPublished ? "yes" : "no"}, delivered{" "}
          {summary.releaseDigestDeliveredCount}/{summary.releaseDigestTotalCount}, queued{" "}
          {summary.releaseDigestQueuedCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Closure packet release digest is fully ready.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing close report closure packet release digest blockers">
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
