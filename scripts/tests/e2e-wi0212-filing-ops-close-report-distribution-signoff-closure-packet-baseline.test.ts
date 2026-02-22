import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const distributionSignoffSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoff.tsx"
  );
  const closurePacketPageSource = readUtf8(
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
    "page.tsx"
  );
  const closurePacketSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacket.tsx"
  );
  const closurePacketPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketPanel.tsx"
  );
  const closurePacketDispatchPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketDispatchPanel.tsx"
  );
  const closurePacketHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-report-distribution-signoff-closure-packet.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0212-filing-ops-close-report-distribution-signoff-closure-packet-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet/,
    "admin nav should include closure packet route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistCloseReportDistributionSignoffClosurePacket/,
    "messages should include closure packet nav key"
  );
  assert.match(
    distributionSignoffSource,
    /Open Closure Packet/,
    "distribution sign-off component should link to closure packet route"
  );
  assert.match(
    distributionSignoffSource,
    /buildCloseReportDistributionSignoffClosurePacketRouteHref/,
    "distribution sign-off component should use closure packet route helper"
  );
  assert.match(
    closurePacketPageSource,
    /PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacket/,
    "closure packet page should render dedicated component"
  );
  assert.match(
    closurePacketSource,
    /id="filing-alert-close-report-distribution-signoff-closure-packet-hub"/,
    "closure packet component should expose root section id"
  );
  assert.match(
    closurePacketSource,
    /PayrollYearEndFilingOpsClosurePacketPanel/,
    "closure packet container should compose closure packet panel"
  );
  assert.match(
    closurePacketSource,
    /PayrollYearEndFilingOpsClosurePacketDispatchPanel/,
    "closure packet container should compose closure packet dispatch panel"
  );
  assert.match(
    closurePacketPanelSource,
    /id="filing-alert-close-report-closure-packet"/,
    "closure packet panel should expose panel id"
  );
  assert.match(
    closurePacketDispatchPanelSource,
    /id="filing-alert-close-report-closure-packet-dispatch"/,
    "closure packet dispatch panel should expose panel id"
  );
  assert.match(
    closurePacketSource,
    /id="filing-alert-close-report-distribution-signoff-closure-packet-readiness"/,
    "closure packet component should expose readiness panel id"
  );
  assert.match(
    closurePacketSource,
    /aria-label="filing close report distribution signoff closure packet blockers"/,
    "closure packet component should expose blocker list aria-label"
  );
  assert.match(
    closurePacketHelperSource,
    /summarizeCloseReportDistributionSignoffClosurePacket/,
    "closure packet helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /WI-0212 /,
    "roadmap should include WI-0212 entry"
  );
  assert.match(
    workItemSource,
    /closure packet/i,
    "work-item should include closure packet scope"
  );
  assert.match(
    workItemSource,
    /distribution sign-off/i,
    "work-item should include distribution sign-off scope"
  );
  assert.match(
    packageJsonSource,
    /e2e-wi0212-filing-ops-close-report-distribution-signoff-closure-packet-baseline\.test\.ts/,
    "package scripts should include WI-0212 regression test"
  );

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet.ts"
  );

  const href = module.buildCloseReportDistributionSignoffClosurePacketRouteHref({
    metric: "pending",
    level: "critical",
    value: 19,
    ownerRole: "manager",
    ownerActorId: "MGR-0212",
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
    signoffReady: false
  });
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\?/,
    "closure packet helper should build dedicated route"
  );
  assert.match(href, /distributionReady=1/, "href should include distribution ready flag");
  assert.match(href, /signoffReady=0/, "href should include sign-off ready flag");

  const closurePacket = module.buildClosurePacketRecord({
    packetId: "closure-packet-0212",
    status: "assembled",
    ownerRole: "manager",
    ownerActorId: "MGR-0212",
    summary: "packet assembled"
  });
  assert.equal(closurePacket.status, "assembled");
  assert.notEqual(closurePacket.assembledAt, null);

  const sealedPacket = module.applyClosurePacket({
    current: closurePacket,
    status: "sealed",
    ownerRole: "admin",
    ownerActorId: "ADMIN-0212",
    summary: "packet sealed"
  });
  assert.equal(sealedPacket.status, "sealed");
  assert.equal(sealedPacket.ownerRole, "admin");
  assert.notEqual(sealedPacket.sealedAt, null);

  const dispatchEntries = module.buildDefaultClosurePacketDispatchEntries();
  assert.equal(dispatchEntries.length, 3);
  assert.equal(dispatchEntries[0].status, "pending");

  const partialDispatch = module.applyClosurePacketDispatchStatus({
    entries: dispatchEntries,
    channel: "ops_archive_room",
    status: "released",
    artifactId: "ART-0212",
    checksum: "SHA256-OPS",
    note: "released to ops archive"
  });
  assert.equal(
    partialDispatch.find((entry: { channel: string }) => entry.channel === "ops_archive_room")?.status,
    "released"
  );

  const blockedSummary = module.summarizeCloseReportDistributionSignoffClosurePacket({
    closurePacketRecord: sealedPacket,
    dispatchEntries: partialDispatch,
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
    signoffReady: true
  });
  assert.equal(blockedSummary.readyForClosurePacket, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = module.summarizeCloseReportDistributionSignoffClosurePacket({
    closurePacketRecord: sealedPacket,
    dispatchEntries: partialDispatch.map((entry: any) => ({
      ...entry,
      status: "released",
      artifactId: entry.artifactId || `ART-${entry.channel}`,
      checksum: entry.checksum || `SHA256-${entry.channel}`,
      preparedAt: entry.preparedAt || "2026-02-22T19:40:00.000Z",
      releasedAt: entry.releasedAt || "2026-02-22T19:41:00.000Z"
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
    signoffReady: true
  });
  assert.equal(readySummary.closurePacketSealed, true);
  assert.equal(readySummary.dispatchReady, true);
  assert.equal(readySummary.readyForClosurePacket, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0212-filing-ops-close-report-distribution-signoff-closure-packet-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
