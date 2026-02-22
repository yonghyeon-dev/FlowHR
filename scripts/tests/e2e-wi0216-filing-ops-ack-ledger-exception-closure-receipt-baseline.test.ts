import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const exceptionLogSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLog.tsx"
  );
  const closureReceiptPageSource = readUtf8(
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
    "closure-receipt",
    "page.tsx"
  );
  const closureReceiptSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceipt.tsx"
  );
  const closureReceiptPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanel.tsx"
  );
  const closureReceiptChannelPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanel.tsx"
  );
  const closureReceiptReadinessPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptReadinessPanel.tsx"
  );
  const closureReceiptHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0216-filing-ops-ack-ledger-exception-closure-receipt-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\/ack-ledger\/exception-log\/closure-receipt/,
    "admin nav should include exception closure receipt route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceipt/,
    "messages should include exception closure receipt nav key"
  );
  assert.match(
    exceptionLogSource,
    /Open Exception Closure Receipt/,
    "exception log component should link to closure receipt route"
  );
  assert.match(
    exceptionLogSource,
    /buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref/,
    "exception log should use closure receipt route helper"
  );
  assert.match(
    closureReceiptPageSource,
    /PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceipt/,
    "closure receipt page should render dedicated component"
  );
  assert.match(
    closureReceiptSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-hub"/,
    "closure receipt component should expose root section id"
  );
  assert.match(
    closureReceiptSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptPanel/,
    "closure receipt container should compose receipt panel"
  );
  assert.match(
    closureReceiptSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptChannelPanel/,
    "closure receipt container should compose channel panel"
  );
  assert.match(
    closureReceiptPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt"/,
    "closure receipt panel should expose panel id"
  );
  assert.match(
    closureReceiptChannelPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-channels"/,
    "closure receipt channel panel should expose panel id"
  );
  assert.match(
    closureReceiptReadinessPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt-readiness"/,
    "closure receipt component should expose readiness panel id"
  );
  assert.match(
    closureReceiptReadinessPanelSource,
    /aria-label="filing close report closure packet release digest ack ledger exception closure receipt blockers"/,
    "closure receipt component should expose blocker list aria-label"
  );
  assert.match(
    closureReceiptHelperSource,
    /summarizeClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt/,
    "closure receipt helper should expose deterministic summary function"
  );
  assert.match(roadmapSource, /WI-0216 /, "roadmap should include WI-0216 entry");
  assert.match(workItemSource, /closure receipt/i, "work-item should include closure receipt scope");
  assert.match(workItemSource, /exception log/i, "work-item should include exception log dependency");
  assert.match(
    packageJsonSource,
    /e2e-wi0216-filing-ops-ack-ledger-exception-closure-receipt-baseline\.test\.ts/,
    "package scripts should include WI-0216 regression test"
  );

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger-exception-log-closure-receipt.ts"
  );

  const href =
    module.buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerExceptionLogClosureReceiptRouteHref(
      {
        metric: "pending",
        level: "critical",
        value: 24,
        ownerRole: "manager",
        ownerActorId: "MGR-0216",
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
        ackChannelsReconciled: true,
        exceptionLogClosed: true,
        allExceptionsResolved: false
      }
    );
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\/ack-ledger\/exception-log\/closure-receipt\?/,
    "closure receipt helper should build dedicated route"
  );
  assert.match(href, /exceptionLogClosed=1/, "href should include exception-log closed flag");
  assert.match(href, /allExceptionsResolved=0/, "href should include all-exceptions-resolved flag");

  const closureReceiptRecord = module.buildClosurePacketReleaseDigestAckLedgerExceptionClosureReceiptRecord({
    receiptId: "exception-closure-receipt-0216",
    status: "issued",
    ownerRole: "manager",
    ownerActorId: "MGR-0216",
    note: "closure receipt issued"
  });
  assert.equal(closureReceiptRecord.status, "issued");
  assert.notEqual(closureReceiptRecord.issuedAt, null);

  const verifiedClosureReceipt = module.applyClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt({
    current: closureReceiptRecord,
    status: "verified",
    ownerRole: "admin",
    ownerActorId: "ADMIN-0216",
    note: "closure receipt verified"
  });
  assert.equal(verifiedClosureReceipt.status, "verified");
  assert.equal(verifiedClosureReceipt.ownerRole, "admin");
  assert.notEqual(verifiedClosureReceipt.verifiedAt, null);

  const closureChannels =
    module.buildDefaultClosurePacketReleaseDigestAckLedgerExceptionClosureChannelEntries();
  assert.equal(closureChannels.length, 3);
  assert.equal(closureChannels[0].status, "pending");

  const partiallyAcknowledgedChannels =
    module.applyClosurePacketReleaseDigestAckLedgerExceptionClosureChannelStatus({
      entries: closureChannels,
      channel: "ops_exception_closure_desk",
      status: "acknowledged",
      referenceId: "REF-0216-OPS",
      ticketId: "TICKET-0216-OPS",
      note: "ops closure acknowledged"
    });
  assert.equal(
    partiallyAcknowledgedChannels.find((entry: { channel: string }) => entry.channel === "ops_exception_closure_desk")
      ?.status,
    "acknowledged"
  );

  const blockedSummary = module.summarizeClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt({
    closureReceiptRecord: verifiedClosureReceipt,
    closureChannelEntries: partiallyAcknowledgedChannels,
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
    ackChannelsReconciled: true,
    exceptionLogClosed: true,
    allExceptionsResolved: true
  });
  assert.equal(blockedSummary.readyForExceptionClosureReceipt, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = module.summarizeClosurePacketReleaseDigestAckLedgerExceptionClosureReceipt({
    closureReceiptRecord: verifiedClosureReceipt,
    closureChannelEntries: partiallyAcknowledgedChannels.map((entry: any) => ({
      ...entry,
      status: "acknowledged",
      referenceId: entry.referenceId || `REF-${entry.channel}`,
      ticketId: entry.ticketId || `TICKET-${entry.channel}`,
      sentAt: entry.sentAt || "2026-02-22T23:20:00.000Z",
      acknowledgedAt: entry.acknowledgedAt || "2026-02-22T23:21:00.000Z"
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
    ackChannelsReconciled: true,
    exceptionLogClosed: true,
    allExceptionsResolved: true
  });
  assert.equal(readySummary.closureReceiptVerified, true);
  assert.equal(readySummary.closureChannelsAcknowledged, true);
  assert.equal(readySummary.readyForExceptionClosureReceipt, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0216-filing-ops-ack-ledger-exception-closure-receipt-baseline.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
