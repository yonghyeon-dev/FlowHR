"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsCloseReportPublicationPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsCloseReportPublicationPanel";
import PayrollYearEndFilingOpsCompletionCloseReportPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsCompletionCloseReportPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  applyCloseReportPublicationStatus,
  applyCompletionCloseReport,
  buildCompletionCloseReportRecord,
  buildDefaultCloseReportPublicationEntries,
  summarizeCompletionCloseReport,
  type CloseReportPublicationChannel,
  type CloseReportPublicationEntry,
  type CompletionCloseReportRecord
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report";
import {
  buildCloseReportGateState,
  buildCloseReportPublicationDraftMap,
  CLOSE_REPORT_GATE_FIELDS,
  type CloseReportDraft,
  type CloseReportGateState,
  type CloseReportPublicationDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-completion-close-report-ui";
import { buildDeliveryLockCompletionReceiptRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-completion-receipt-archive-digest";
import { buildCloseReportDistributionSignoffRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCompletionCloseReport() {
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

  const [metric, setMetric] = useState<AlertMetric>(() => normalizeMetric(metricParam));
  const [level, setLevel] = useState<FilingOpsAlertLevel>(() => normalizeAlertLevel(levelParam));
  const [ownerRole, setOwnerRole] = useState(() => (ownerRoleParam ?? "").trim());
  const [ownerActorId, setOwnerActorId] = useState(() => (ownerActorIdParam ?? "").trim());
  const [currentValueInput, setCurrentValueInput] = useState(valueParam ?? "");
  const [gates, setGates] = useState<CloseReportGateState>(() =>
    buildCloseReportGateState({
      handoffReadyParam,
      exportReadyParam,
      archiveReadyParam,
      routingReadyParam,
      signatureReadyParam,
      packageLockedParam,
      handoverAcknowledgedParam,
      receiptVerifiedParam,
      digestReadyParam
    })
  );
  const [closeReportRecord, setCloseReportRecord] = useState<CompletionCloseReportRecord>(() =>
    buildCompletionCloseReportRecord({
      reportId: `close-report-${normalizeMetric(metricParam)}`,
      status: "pending",
      ownerRole: "manager",
      ownerActorId: ownerActorIdParam ?? "",
      summary: ""
    })
  );
  const [closeReportDraft, setCloseReportDraft] = useState<CloseReportDraft>({
    status: "pending",
    ownerRole: "manager",
    ownerActorId: ownerActorIdParam ?? "",
    summary: ""
  });
  const [publicationEntries, setPublicationEntries] = useState<CloseReportPublicationEntry[]>(() =>
    buildDefaultCloseReportPublicationEntries()
  );
  const [publicationDrafts, setPublicationDrafts] = useState<
    Record<CloseReportPublicationChannel, CloseReportPublicationDraft>
  >(() => buildCloseReportPublicationDraftMap(buildDefaultCloseReportPublicationEntries()));

  useEffect(() => {
    const normalizedMetric = normalizeMetric(metricParam);
    const normalizedLevel = normalizeAlertLevel(levelParam);
    const normalizedOwnerRole = (ownerRoleParam ?? "").trim();
    const normalizedOwnerActorId = (ownerActorIdParam ?? "").trim();
    const defaultPublicationEntries = buildDefaultCloseReportPublicationEntries();

    setMetric(normalizedMetric);
    setLevel(normalizedLevel);
    setOwnerRole(normalizedOwnerRole);
    setOwnerActorId(normalizedOwnerActorId);
    setCurrentValueInput(valueParam ?? "");
    setGates(
      buildCloseReportGateState({
        handoffReadyParam,
        exportReadyParam,
        archiveReadyParam,
        routingReadyParam,
        signatureReadyParam,
        packageLockedParam,
        handoverAcknowledgedParam,
        receiptVerifiedParam,
        digestReadyParam
      })
    );
    setCloseReportRecord(
      buildCompletionCloseReportRecord({
        reportId: `close-report-${normalizedMetric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId: normalizedOwnerActorId,
        summary: ""
      })
    );
    setCloseReportDraft({
      status: "pending",
      ownerRole: "manager",
      ownerActorId: normalizedOwnerActorId,
      summary: ""
    });
    setPublicationEntries(defaultPublicationEntries);
    setPublicationDrafts(buildCloseReportPublicationDraftMap(defaultPublicationEntries));
  }, [
    archiveReadyParam,
    digestReadyParam,
    exportReadyParam,
    handoffReadyParam,
    handoverAcknowledgedParam,
    levelParam,
    metricParam,
    ownerActorIdParam,
    ownerRoleParam,
    packageLockedParam,
    receiptVerifiedParam,
    routingReadyParam,
    signatureReadyParam,
    valueParam
  ]);

  const currentValue = parseOptionalInt(currentValueInput);
  const summary = useMemo(
    () => summarizeCompletionCloseReport({ closeReportRecord, publicationEntries, ...gates }),
    [closeReportRecord, gates, publicationEntries]
  );
  const completionReceiptHref = buildDeliveryLockCompletionReceiptRouteHref({
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
    handoverAcknowledged: gates.handoverAcknowledged
  });
  const distributionSignoffHref = buildCloseReportDistributionSignoffRouteHref({
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
    publicationReady: summary.publicationReady
  });

  return (
    <section className="panel" id="filing-alert-completion-close-report-hub">
      <h2>Payroll Filing Completion Close Report</h2>
      <p className="small">Publish final close reports and confirm channel publication before closure.</p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={completionReceiptHref} className="btn btn-secondary btn-small">
          Back to Completion Receipt + Archive Digest
        </Link>
        <Link href={distributionSignoffHref} className="btn btn-secondary btn-small">
          Open Distribution Sign-off
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          close readiness
          <span className={readinessBadgeClass(summary.readyToClose)}>{summary.readyToClose ? "ready" : "hold"}</span>
        </p>
      </div>

      <PayrollYearEndFilingOpsCompletionCloseReportPanel
        closeReportRecord={closeReportRecord}
        closeReportDraft={closeReportDraft}
        onCloseReportDraftChange={setCloseReportDraft}
        onApplyCloseReport={() =>
          setCloseReportRecord((prev) =>
            applyCompletionCloseReport({
              current: prev,
              status: closeReportDraft.status,
              ownerRole: closeReportDraft.ownerRole,
              ownerActorId: closeReportDraft.ownerActorId,
              summary: closeReportDraft.summary
            })
          )
        }
      />

      <PayrollYearEndFilingOpsCloseReportPublicationPanel
        publicationEntries={publicationEntries}
        publicationDrafts={publicationDrafts}
        onPublicationDraftChange={(channel, next) =>
          setPublicationDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyPublicationChannel={(channel) =>
          setPublicationEntries((prev) =>
            applyCloseReportPublicationStatus({
              entries: prev,
              channel,
              status: publicationDrafts[channel].status,
              artifactId: publicationDrafts[channel].artifactId,
              receiptReference: publicationDrafts[channel].receiptReference,
              note: publicationDrafts[channel].note
            })
          )
        }
      />

      <article className="panel" id="filing-alert-close-report-readiness">
        <h3>Completion Close Report Readiness</h3>
        <div className={styles.controlGrid}>
          {CLOSE_REPORT_GATE_FIELDS.map((field) => (
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
        <p className={`small ${summary.readyToClose ? "ok" : "fail"}`}>
          closeReportPublished {summary.closeReportPublished ? "yes" : "no"}, publicationPublished{" "}
          {summary.publicationPublishedCount}/{summary.publicationTotalCount}, publicationQueued{" "}
          {summary.publicationQueuedCount}
        </p>
        {summary.blockers.length === 0 ? (
          <p className="small ok">Completion close report is fully ready for final closure.</p>
        ) : (
          <ul className={styles.blockerList} aria-label="filing completion close report blockers">
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
