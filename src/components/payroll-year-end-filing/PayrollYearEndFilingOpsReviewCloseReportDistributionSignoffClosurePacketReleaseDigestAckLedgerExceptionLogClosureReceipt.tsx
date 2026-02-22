"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanel";
import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanel";
import PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptReadinessPanel from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptReadinessPanel";
import styles from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.module.css";
import type { FilingOpsAlertLevel } from "@/components/payroll-year-end-filing/PayrollYearEndFilingOpsDashboard";
import type { AlertMetric } from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import {
  normalizeAlertLevel,
  normalizeMetric,
  parseOptionalInt
} from "@/components/payroll-year-end-filing/filing-alert-execution-checklist";
import { buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log";
import {
  applyClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus,
  applyClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt,
  buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref,
  buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord,
  buildDefaultClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntries,
  summarizeClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt";
import {
  buildClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraftMap,
  buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft,
  type ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptDraft
} from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-ui";
import { readExceptionClosureReceiptQueryParams } from "@/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-query";

function readinessBadgeClass(ready: boolean) {
  return `${styles.statusBadge} ${ready ? styles.statusReady : styles.statusHold}`;
}

export default function PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceipt() {
  const searchParams = useSearchParams();
  const queryParams = useMemo(
    () => readExceptionClosureReceiptQueryParams(searchParams),
    [searchParams]
  );

  const metric: AlertMetric = normalizeMetric(queryParams.metricParam);
  const level: FilingOpsAlertLevel = normalizeAlertLevel(queryParams.levelParam);
  const ownerRole = (queryParams.ownerRoleParam ?? "").trim();
  const ownerActorId = (queryParams.ownerActorIdParam ?? "").trim();
  const currentValue = parseOptionalInt(queryParams.valueParam ?? "");

  const [gates, setGates] = useState<ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState>(
    () => buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState(queryParams)
  );
  const [closureReceiptRecord, setClosureReceiptRecord] =
    useState<ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord>(() =>
      buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord({
        receiptId: `exception-closure-receipt-${metric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId,
        note: ""
      })
    );
  const [closureReceiptDraft, setClosureReceiptDraft] =
    useState<ClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptDraft>({
      status: "pending",
      ownerRole: "manager",
      ownerActorId,
      note: ""
    });
  const [closureChannelEntries, setClosureChannelEntries] = useState<
    ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntry[]
  >(() => buildDefaultClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntries());
  const [closureChannelDrafts, setClosureChannelDrafts] = useState<
    Record<
      ClosurePacketReleaseDigestAckLedgerExceptionClosureChannel,
      ClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraft
    >
  >(() =>
    buildClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraftMap(
      buildDefaultClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntries()
    )
  );

  useEffect(() => {
    const defaultClosureChannels = buildDefaultClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntries();
    setGates(buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptGateState(queryParams));
    setClosureReceiptRecord(
      buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord({
        receiptId: `exception-closure-receipt-${metric}`,
        status: "pending",
        ownerRole: "manager",
        ownerActorId,
        note: ""
      })
    );
    setClosureReceiptDraft({
      status: "pending",
      ownerRole: "manager",
      ownerActorId,
      note: ""
    });
    setClosureChannelEntries(defaultClosureChannels);
    setClosureChannelDrafts(
      buildClosurePacketReleaseDigestAckLedgerExceptionClosureChannelDraftMap(defaultClosureChannels)
    );
  }, [metric, ownerActorId, queryParams]);

  const summary = useMemo(
    () =>
      summarizeClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt({
        closureReceiptRecord,
        closureChannelEntries,
        ...gates
      }),
    [closureChannelEntries, closureReceiptRecord, gates]
  );

  const exceptionLogHref =
    buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref({
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
  const selfHref =
    buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref(
      {
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
      }
    );

  return (
    <section
      className="panel"
      id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-hub"
    >
      <h2>Payroll Filing Exception Closure Receipt</h2>
      <p className="small">
        Verify exception closure receipt and channel acknowledgments after acknowledgment exception log closure.
      </p>
      <div className="panel-actions">
        <Link href="/admin/payroll-year-end-filing/ops" className="btn btn-secondary btn-small">
          Back to Ops Dashboard
        </Link>
        <Link href={exceptionLogHref} className="btn btn-secondary btn-small">
          Back to Exception Log
        </Link>
        <Link href={selfHref} className="btn btn-secondary btn-small">
          Refresh Exception Closure Receipt Context
        </Link>
      </div>

      <div className={styles.contextGrid}>
        <p className="small">
          metric {metric} / level {level.toUpperCase()} / owner {ownerRole || "-"}:{ownerActorId || "-"} /
          value {currentValue ?? "-"}
        </p>
        <p className="small">
          exception closure receipt readiness
          <span className={readinessBadgeClass(summary.readyForExceptionClosureReceipt)}>
            {summary.readyForExceptionClosureReceipt ? "ready" : "hold"}
          </span>
        </p>
      </div>

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanel
        closureReceiptRecord={closureReceiptRecord}
        closureReceiptDraft={closureReceiptDraft}
        onClosureReceiptDraftChange={setClosureReceiptDraft}
        onApplyClosureReceipt={() =>
          setClosureReceiptRecord((prev) =>
            applyClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt({
              current: prev,
              status: closureReceiptDraft.status,
              ownerRole: closureReceiptDraft.ownerRole,
              ownerActorId: closureReceiptDraft.ownerActorId,
              note: closureReceiptDraft.note
            })
          )
        }
      />

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanel
        closureChannelEntries={closureChannelEntries}
        closureChannelDrafts={closureChannelDrafts}
        onClosureChannelDraftChange={(channel, next) =>
          setClosureChannelDrafts((prev) => ({
            ...prev,
            [channel]: next
          }))
        }
        onApplyClosureChannel={(channel) =>
          setClosureChannelEntries((prev) =>
            applyClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus({
              entries: prev,
              channel,
              status: closureChannelDrafts[channel].status,
              referenceId: closureChannelDrafts[channel].referenceId,
              ticketId: closureChannelDrafts[channel].ticketId,
              note: closureChannelDrafts[channel].note
            })
          )
        }
      />

      <PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptReadinessPanel
        gates={gates}
        summary={summary}
        onGateChange={(key, value) => setGates((prev) => ({ ...prev, [key]: value }))}
      />
    </section>
  );
}
