"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsCloseReportDistributionPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsCloseReportDistributionPanel";
import PayrollYearEndFilingOpsCloseReportSignoffPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsCloseReportSignoffPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildCompletionReceiptCloseReportRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report";
import {
  applyCloseReportDistributionStatus,
  applyCloseReportSignoffStatus,
  buildDefaultCloseReportDistributionEntries,
  buildDefaultCloseReportSignoffEntries,
  summarizeCloseReportDistributionSignoff,
  type CloseReportDistributionChannel,
  type CloseReportDistributionEntry,
  type CloseReportSignoffEntry
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff";
import {
  buildCloseReportDistributionDraftMap,
  buildCloseReportDistributionSignoffGateState,
  buildCloseReportSignoffDraftMap,
  CLOSE_REPORT_DISTRIBUTION_GATE_FIELDS,
  type CloseReportDistributionDraft,
  type CloseReportDistributionSignoffGateState,
  type CloseReportSignoffDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-ui";
import { buildCloseReportDistributionSignoffClosurePacketRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet";
import type { ReviewHandoffRole } from "@/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCloseReportDistributionSignoff() {
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

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<CloseReportDistributionSignoffGateState>(() =>
    buildCloseReportDistributionSignoffGateState({
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
      publicationReadyParam
    })
  );
  const [distributionEntries, setDistributionEntries] = useState<CloseReportDistributionEntry[]>(() =>
    buildDefaultCloseReportDistributionEntries()
  );
  const [distributionDrafts, setDistributionDrafts] = useState<
    Record<CloseReportDistributionChannel, CloseReportDistributionDraft>
  >(() => buildCloseReportDistributionDraftMap(buildDefaultCloseReportDistributionEntries()));
  const [signoffEntries, setSignoffEntries] = useState<CloseReportSignoffEntry[]>(() =>
    buildDefaultCloseReportSignoffEntries()
  );
  const [signoffDrafts, setSignoffDrafts] = useState<Record<ReviewHandoffRole, CloseReportSignoffDraft>>(() =>
    buildCloseReportSignoffDraftMap(buildDefaultCloseReportSignoffEntries())
  );

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultDistributionEntries = buildDefaultCloseReportDistributionEntries();
    const defaultSignoffEntries = buildDefaultCloseReportSignoffEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildCloseReportDistributionSignoffGateState({
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
        publicationReadyParam
      })
    );
    setDistributionEntries(defaultDistributionEntries);
    setDistributionDrafts(buildCloseReportDistributionDraftMap(defaultDistributionEntries));
    setSignoffEntries(defaultSignoffEntries);
    setSignoffDrafts(buildCloseReportSignoffDraftMap(defaultSignoffEntries));
  }, [
    archiveReadyParam,
    closeReportPublishedParam,
    digestReadyParam,
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
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const summary = useMemo(
    () => summarizeCloseReportDistributionSignoff({ distributionEntries, signoffEntries, ...gates }),
    [distributionEntries, gates, signoffEntries]
  );
  const closeReportHref = buildCompletionReceiptCloseReportRouteHref({
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
    digestReady: gates.digestReady
  });
  const closurePacketHref = buildCloseReportDistributionSignoffClosurePacketRouteHref({
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
    signoffReady: summary.signoffReady
  });

  return (
    <section className="panel" id="filing-alert-close-report-distribution-signoff-hub">
      <h2>Payroll Filing Close Report Distribution Sign-off</h2>
      <p className="small">Track close report distribution channels and role sign-off before final closure.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={closeReportHref} className="btn btn-secondary btn-small">
          Back to Completion Close Report
        </Link>
        <Link href={closurePacketHref} className="btn btn-secondary btn-small">
          Open Closure Packet
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          sign-off readiness
          <span className={readinessBadgeClass(summary.readyForDistributionSignoff)}>
            {summary.readyForDistributionSignoff ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsCloseReportDistributionPanel
        distributionEntries={distributionEntries}
        distributionDrafts={distributionDrafts}
        onDistributionDraftChange={(channel, next) =>
          setDistributionDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyDistributionChannel={(channel) =>
          setDistributionEntries((prev) =>
            applyCloseReportDistributionStatus({
              entries: prev,
              channel,
              status: distributionDrafts[channel].status,
              batchId: distributionDrafts[channel].batchId,
              targetGroup: distributionDrafts[channel].targetGroup,
              note: distributionDrafts[channel].note
            })
          )
        }
      />

      <PayrollYearEndFilingOpsCloseReportSignoffPanel
        signoffEntries={signoffEntries}
        signoffDrafts={signoffDrafts}
        onSignoffDraftChange={(role, next) =>
          setSignoffDrafts((prev) => ({
            ...prev,
            [role]: next
          }))
        }
        onApplySignoffRole={(role) =>
          setSignoffEntries((prev) =>
            applyCloseReportSignoffStatus({
              entries: prev,
              role,
              status: signoffDrafts[role].status,
              actorId: signoffDrafts[role].actorId,
              note: signoffDrafts[role].note
            })
          )
        }
      />

      <article className="panel" id="filing-alert-close-report-distribution-signoff-readiness">
        <h3>Distribution Sign-off Readiness</h3>
        <div className={styles.controlGrid}>
          {CLOSE_REPORT_DISTRIBUTION_GATE_FIELDS.map((field) => (
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
        <p className={`small ${summary.readyForDistributionSignoff ? "ok" : "fail"}`}>
          distributionConfirmed {summary.distributionConfirmedCount}/{summary.distributionTotalCount}, signoffSigned{" "}
          {summary.signoffSignedCount}/{summary.signoffTotalCount}, signoffRejected {summary.signoffRejectedCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Close report distribution sign-off is fully ready.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing close report distribution signoff blockers">
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
