import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const ackLedgerSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedger.tsx"
  );
  const exceptionLogPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist",
    "review",
    "snapshot",
    "handoff",
    "close-off",
    "routing-signature",
    "delivery-lock",
    "completion-receipt",
    "close-report",
    "distribution-signoff",
    "closure-packet",
    "release-digest",
    "ack-ledger",
    "exception-log",
    "page.tsx"
  );
  const exceptionLogSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLog.tsx"
  );
  const exceptionLogPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogPanel.tsx"
  );
  const exceptionEntryPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionEntryPanel.tsx"
  );
  const exceptionLogHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0215-filing-ops-ack-ledger-exception-log-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\/ack-ledger\/exception-log/,
    "admin nav should include ack ledger exception log route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedgerExceptionLog/,
    "messages should include ack ledger exception log nav key"
  );
  assert.match(
    ackLedgerSource,
    /Open Exception Log/,
    "ack ledger component should link to exception log route"
  );
  assert.match(
    ackLedgerSource,
    /buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref/,
    "ack ledger component should use exception log route helper"
  );
  assert.match(
    exceptionLogPageSource,
    /PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLog/,
    "exception log page should render dedicated component"
  );
  assert.match(
    exceptionLogSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-hub"/,
    "exception log component should expose root section id"
  );
  assert.match(
    exceptionLogSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogPanel/,
    "exception log container should compose exception log panel"
  );
  assert.match(
    exceptionLogSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionEntryPanel/,
    "exception log container should compose exception entry panel"
  );
  assert.match(
    exceptionLogPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log"/,
    "exception log panel should expose panel id"
  );
  assert.match(
    exceptionEntryPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exceptions"/,
    "exception entry panel should expose panel id"
  );
  assert.match(
    exceptionLogSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-readiness"/,
    "exception log component should expose readiness panel id"
  );
  assert.match(
    exceptionLogSource,
    /aria-label="filing close report closure packet release digest ack ledger exception log blockers"/,
    "exception log component should expose blocker list aria-label"
  );
  assert.match(
    exceptionLogHelperSource,
    /summarizeClosurePacketReleaseDigestAckLedgerExceptionLog/,
    "exception log helper should expose deterministic summary function"
  );
  assert.match(roadmapSource, /WI-0215 /, "roadmap should include WI-0215 entry");
  assert.match(workItemSource, /exception log/i, "work-item should include exception log scope");
  assert.match(workItemSource, /ack ledger/i, "work-item should include ack ledger scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0215-filing-ops-ack-ledger-exception-log-baseline\.test\.ts/,
    "package scripts should include WI-0215 regression test"
  );

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log.ts"
  );

  const href = module.buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogRouteHref({
    metric: "pending",
    level: "critical",
    value: 23,
    ownerRole: "manager",
    ownerActorId: "MGR-0215",
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true,
    receiptVerified: true,
    digestReady: true,
    closeReportPublished: true,
    publicationReady: true,
    distributionReady: true,
    signoffReady: true,
    closurePacketSealed: true,
    dispatchReady: true,
    releaseDigestPublished: true,
    releaseDigestDeliveryReady: true,
    ackLedgerVerified: true,
    ackChannelsReconciled: false
  });
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\/ack-ledger\/exception-log\?/,
    "exception log helper should build dedicated route"
  );
  assert.match(href, /ackLedgerVerified=1/, "href should include ack ledger verified flag");
  assert.match(href, /ackChannelsReconciled=0/, "href should include ack channels reconciled flag");

  const exceptionLogRecord = module.buildClosurePacketReleaseDigestAckLedgerExceptionLogRecord({
    logId: "ack-exception-0215",
    status: "recorded",
    ownerRole: "manager",
    ownerActorId: "MGR-0215",
    summary: "exception log recorded"
  });
  assert.equal(exceptionLogRecord.status, "recorded");
  assert.notEqual(exceptionLogRecord.recordedAt, null);

  const closedExceptionLog = module.applyClosurePacketReleaseDigestAckLedgerExceptionLog({
    current: exceptionLogRecord,
    status: "closed",
    ownerRole: "admin",
    ownerActorId: "ADMIN-0215",
    summary: "exception log closed"
  });
  assert.equal(closedExceptionLog.status, "closed");
  assert.equal(closedExceptionLog.ownerRole, "admin");
  assert.notEqual(closedExceptionLog.closedAt, null);

  const exceptionEntries = module.buildDefaultClosurePacketReleaseDigestAckLedgerExceptionEntries();
  assert.equal(exceptionEntries.length, 3);
  assert.equal(exceptionEntries[0].status, "open");

  const partialResolvedEntries = module.applyClosurePacketReleaseDigestAckLedgerExceptionEntryStatus({
    entries: exceptionEntries,
    category: "ops_exception_desk",
    status: "resolved",
    incidentId: "INC-0215-OPS",
    referenceId: "REF-0215-OPS",
    note: "ops exception resolved"
  });
  assert.equal(
    partialResolvedEntries.find((entry: { category: string }) => entry.category === "ops_exception_desk")
      ?.status,
    "resolved"
  );

  const blockedSummary = module.summarizeClosurePacketReleaseDigestAckLedgerExceptionLog({
    exceptionLogRecord: closedExceptionLog,
    exceptionEntries: partialResolvedEntries,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true,
    receiptVerified: true,
    digestReady: true,
    closeReportPublished: true,
    publicationReady: true,
    distributionReady: true,
    signoffReady: true,
    closurePacketSealed: true,
    dispatchReady: true,
    releaseDigestPublished: true,
    releaseDigestDeliveryReady: true,
    ackLedgerVerified: true,
    ackChannelsReconciled: true
  });
  assert.equal(blockedSummary.readyForExceptionClosure, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = module.summarizeClosurePacketReleaseDigestAckLedgerExceptionLog({
    exceptionLogRecord: closedExceptionLog,
    exceptionEntries: partialResolvedEntries.map((entry: any) => ({
      ...entry,
      status: "resolved",
      incidentId: entry.incidentId || `INC-${entry.category}`,
      referenceId: entry.referenceId || `REF-${entry.category}`,
      openedAt: entry.openedAt || "2026-02-22T23:10:00.000Z",
      resolvedAt: entry.resolvedAt || "2026-02-22T23:11:00.000Z"
    })),
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true,
    receiptVerified: true,
    digestReady: true,
    closeReportPublished: true,
    publicationReady: true,
    distributionReady: true,
    signoffReady: true,
    closurePacketSealed: true,
    dispatchReady: true,
    releaseDigestPublished: true,
    releaseDigestDeliveryReady: true,
    ackLedgerVerified: true,
    ackChannelsReconciled: true
  });
  assert.equal(readySummary.exceptionLogClosed, true);
  assert.equal(readySummary.allExceptionsResolved, true);
  assert.equal(readySummary.readyForExceptionClosure, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0215-filing-ops-ack-ledger-exception-log-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
