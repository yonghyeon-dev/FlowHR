import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const releaseDigestSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigest.tsx"
  );
  const ackLedgerPageSource = readUtf8(
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
    "page.tsx"
  );
  const ackLedgerSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedger.tsx"
  );
  const ackLedgerPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerPanel.tsx"
  );
  const ackLedgerChannelPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerChannelPanel.tsx"
  );
  const ackLedgerHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0214-filing-ops-release-digest-acknowledgment-ledger-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\/ack-ledger/,
    "admin nav should include release digest acknowledgment ledger route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistClosurePacketReleaseDigestAckLedger/,
    "messages should include release digest acknowledgment ledger nav key"
  );
  assert.match(
    releaseDigestSource,
    /Open Ack Ledger/,
    "release digest component should link to acknowledgment ledger route"
  );
  assert.match(
    releaseDigestSource,
    /buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref/,
    "release digest component should use acknowledgment ledger route helper"
  );
  assert.match(
    ackLedgerPageSource,
    /PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedger/,
    "ack ledger page should render dedicated component"
  );
  assert.match(
    ackLedgerSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-hub"/,
    "ack ledger component should expose root section id"
  );
  assert.match(
    ackLedgerSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerPanel/,
    "ack ledger container should compose ack ledger panel"
  );
  assert.match(
    ackLedgerSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestAckLedgerChannelPanel/,
    "ack ledger container should compose ack ledger channel panel"
  );
  assert.match(
    ackLedgerPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger"/,
    "ack ledger panel should expose panel id"
  );
  assert.match(
    ackLedgerChannelPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-channels"/,
    "ack ledger channels panel should expose panel id"
  );
  assert.match(
    ackLedgerSource,
    /id="filing-alert-close-report-closure-packet-release-digest-ack-ledger-readiness"/,
    "ack ledger component should expose readiness panel id"
  );
  assert.match(
    ackLedgerSource,
    /aria-label="filing close report closure packet release digest acknowledgment ledger blockers"/,
    "ack ledger component should expose blocker list aria-label"
  );
  assert.match(
    ackLedgerHelperSource,
    /summarizeClosurePacketReleaseDigestAckLedger/,
    "ack ledger helper should expose deterministic summary function"
  );
  assert.match(roadmapSource, /WI-0214 /, "roadmap should include WI-0214 entry");
  assert.match(workItemSource, /acknowledgment ledger/i, "work-item should include acknowledgment ledger scope");
  assert.match(workItemSource, /release digest/i, "work-item should include release digest scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0214-filing-ops-release-digest-acknowledgment-ledger-baseline\.test\.ts/,
    "package scripts should include WI-0214 regression test"
  );

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest-ack-ledger.ts"
  );

  const href = module.buildCloseReportDistributionSignoffClosurePacketReleaseDigestAckLedgerRouteHref({
    metric: "pending",
    level: "critical",
    value: 22,
    ownerRole: "manager",
    ownerActorId: "MGR-0214",
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
    releaseDigestDeliveryReady: false
  });
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\/ack-ledger\?/,
    "ack ledger helper should build dedicated route"
  );
  assert.match(href, /releaseDigestPublished=1/, "href should include release digest published flag");
  assert.match(href, /releaseDigestDeliveryReady=0/, "href should include release digest delivery ready flag");

  const ackLedger = module.buildClosurePacketReleaseDigestAckLedgerRecord({
    ledgerId: "ack-ledger-0214",
    status: "logged",
    ownerRole: "manager",
    ownerActorId: "MGR-0214",
    note: "ack ledger logged"
  });
  assert.equal(ackLedger.status, "logged");
  assert.notEqual(ackLedger.loggedAt, null);

  const verifiedAckLedger = module.applyClosurePacketReleaseDigestAckLedger({
    current: ackLedger,
    status: "verified",
    ownerRole: "admin",
    ownerActorId: "ADMIN-0214",
    note: "ack ledger verified"
  });
  assert.equal(verifiedAckLedger.status, "verified");
  assert.equal(verifiedAckLedger.ownerRole, "admin");
  assert.notEqual(verifiedAckLedger.verifiedAt, null);

  const ackChannels = module.buildDefaultClosurePacketReleaseDigestAckChannelEntries();
  assert.equal(ackChannels.length, 3);
  assert.equal(ackChannels[0].status, "pending");

  const partialAckChannels = module.applyClosurePacketReleaseDigestAckChannelStatus({
    entries: ackChannels,
    channel: "ops_ack_desk",
    status: "reconciled",
    ackCode: "ACK-OPS-0214",
    referenceId: "REF-OPS-0214",
    note: "ops channel reconciled"
  });
  assert.equal(
    partialAckChannels.find((entry: { channel: string }) => entry.channel === "ops_ack_desk")?.status,
    "reconciled"
  );

  const blockedSummary = module.summarizeClosurePacketReleaseDigestAckLedger({
    ackLedgerRecord: verifiedAckLedger,
    ackChannelEntries: partialAckChannels,
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
    releaseDigestDeliveryReady: true
  });
  assert.equal(blockedSummary.readyForAckLedger, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = module.summarizeClosurePacketReleaseDigestAckLedger({
    ackLedgerRecord: verifiedAckLedger,
    ackChannelEntries: partialAckChannels.map((entry: any) => ({
      ...entry,
      status: "reconciled",
      ackCode: entry.ackCode || `ACK-${entry.channel}`,
      referenceId: entry.referenceId || `REF-${entry.channel}`,
      acknowledgedAt: entry.acknowledgedAt || "2026-02-22T22:10:00.000Z",
      reconciledAt: entry.reconciledAt || "2026-02-22T22:11:00.000Z"
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
    releaseDigestDeliveryReady: true
  });
  assert.equal(readySummary.ackLedgerVerified, true);
  assert.equal(readySummary.ackChannelsReconciled, true);
  assert.equal(readySummary.readyForAckLedger, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0214-filing-ops-release-digest-acknowledgment-ledger-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
