import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const closurePacketSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacket.tsx"
  );
  const releaseDigestPageSource = readUtf8(
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
    "page.tsx"
  );
  const releaseDigestSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigest.tsx"
  );
  const releaseDigestPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestPanel.tsx"
  );
  const releaseDigestChannelPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsClosurePacketReleaseDigestChannelPanel.tsx"
  );
  const releaseDigestHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0213-filing-ops-closure-packet-release-digest-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest/,
    "admin nav should include closure packet release digest route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistClosurePacketReleaseDigest/,
    "messages should include closure packet release digest nav key"
  );
  assert.match(
    closurePacketSource,
    /Open Release Digest/,
    "closure packet component should link to release digest route"
  );
  assert.match(
    closurePacketSource,
    /buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref/,
    "closure packet component should use release digest route helper"
  );
  assert.match(
    releaseDigestPageSource,
    /PayrollYearEndFilingOpsReviewCloseReportDistributionSignoffClosurePacketReleaseDigest/,
    "release digest page should render dedicated component"
  );
  assert.match(
    releaseDigestSource,
    /id="filing-alert-close-report-closure-packet-release-digest-hub"/,
    "release digest component should expose root section id"
  );
  assert.match(
    releaseDigestSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestPanel/,
    "release digest container should compose release digest panel"
  );
  assert.match(
    releaseDigestSource,
    /PayrollYearEndFilingOpsClosurePacketReleaseDigestChannelPanel/,
    "release digest container should compose release digest channel panel"
  );
  assert.match(
    releaseDigestPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest"/,
    "release digest panel should expose panel id"
  );
  assert.match(
    releaseDigestChannelPanelSource,
    /id="filing-alert-close-report-closure-packet-release-digest-channels"/,
    "release digest channels panel should expose panel id"
  );
  assert.match(
    releaseDigestSource,
    /id="filing-alert-close-report-closure-packet-release-digest-readiness"/,
    "release digest component should expose readiness panel id"
  );
  assert.match(
    releaseDigestSource,
    /aria-label="filing close report closure packet release digest blockers"/,
    "release digest component should expose blocker list aria-label"
  );
  assert.match(
    releaseDigestHelperSource,
    /summarizeClosurePacketReleaseDigest/,
    "release digest helper should expose deterministic summary function"
  );
  assert.match(roadmapSource, /WI-0213 /, "roadmap should include WI-0213 entry");
  assert.match(workItemSource, /release digest/i, "work-item should include release digest scope");
  assert.match(workItemSource, /closure packet/i, "work-item should include closure packet scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0213-filing-ops-closure-packet-release-digest-baseline\.test\.ts/,
    "package scripts should include WI-0213 regression test"
  );

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff-closure-packet-release-digest.ts"
  );

  const href = module.buildCloseReportDistributionSignoffClosurePacketReleaseDigestRouteHref({
    metric: "pending",
    level: "critical",
    value: 21,
    ownerRole: "manager",
    ownerActorId: "MGR-0213",
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
    dispatchReady: false
  });
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\/closure-packet\/release-digest\?/,
    "release digest helper should build dedicated route"
  );
  assert.match(href, /closurePacketSealed=1/, "href should include closure packet sealed flag");
  assert.match(href, /dispatchReady=0/, "href should include dispatch ready flag");

  const digestRecord = module.buildClosurePacketReleaseDigestRecord({
    digestId: "release-digest-0213",
    status: "compiled",
    ownerRole: "manager",
    ownerActorId: "MGR-0213",
    summary: "compiled release digest"
  });
  assert.equal(digestRecord.status, "compiled");
  assert.notEqual(digestRecord.compiledAt, null);

  const publishedDigestRecord = module.applyClosurePacketReleaseDigest({
    current: digestRecord,
    status: "published",
    ownerRole: "admin",
    ownerActorId: "ADMIN-0213",
    summary: "published release digest"
  });
  assert.equal(publishedDigestRecord.status, "published");
  assert.equal(publishedDigestRecord.ownerRole, "admin");
  assert.notEqual(publishedDigestRecord.publishedAt, null);

  const channelEntries = module.buildDefaultClosurePacketReleaseDigestChannelEntries();
  assert.equal(channelEntries.length, 3);
  assert.equal(channelEntries[0].status, "pending");

  const partialChannels = module.applyClosurePacketReleaseDigestChannelStatus({
    entries: channelEntries,
    channel: "ops_digest_board",
    status: "delivered",
    artifactId: "ART-0213",
    referenceId: "REF-0213",
    note: "delivered to ops digest board"
  });
  assert.equal(
    partialChannels.find((entry: { channel: string }) => entry.channel === "ops_digest_board")?.status,
    "delivered"
  );

  const blockedSummary = module.summarizeClosurePacketReleaseDigest({
    releaseDigestRecord: publishedDigestRecord,
    releaseDigestChannelEntries: partialChannels,
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
    dispatchReady: true
  });
  assert.equal(blockedSummary.readyForReleaseDigest, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = module.summarizeClosurePacketReleaseDigest({
    releaseDigestRecord: publishedDigestRecord,
    releaseDigestChannelEntries: partialChannels.map((entry: any) => ({
      ...entry,
      status: "delivered",
      artifactId: entry.artifactId || `ART-${entry.channel}`,
      referenceId: entry.referenceId || `REF-${entry.channel}`,
      queuedAt: entry.queuedAt || "2026-02-22T20:20:00.000Z",
      deliveredAt: entry.deliveredAt || "2026-02-22T20:21:00.000Z"
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
    dispatchReady: true
  });
  assert.equal(readySummary.releaseDigestPublished, true);
  assert.equal(readySummary.releaseDigestDeliveryReady, true);
  assert.equal(readySummary.readyForReleaseDigest, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0213-filing-ops-closure-packet-release-digest-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
