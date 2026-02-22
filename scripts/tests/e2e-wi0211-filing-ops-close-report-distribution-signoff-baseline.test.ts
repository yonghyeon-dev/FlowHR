import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const completionCloseReportSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCompletionCloseReport.tsx"
  );
  const distributionSignoffPageSource = readUtf8(
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
    "page.tsx"
  );
  const distributionSignoffSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseReportDistributionSignoff.tsx"
  );
  const distributionPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsCloseReportDistributionPanel.tsx"
  );
  const signoffPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsCloseReportSignoffPanel.tsx"
  );
  const distributionSignoffHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-report-distribution-signoff.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0211-filing-ops-close-report-distribution-signoff-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff/,
    "admin nav should include close report distribution sign-off route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistCloseReportDistributionSignoff/,
    "messages should include close report distribution sign-off nav key"
  );
  assert.match(
    completionCloseReportSource,
    /Open Distribution Sign-off/,
    "completion close report component should link to distribution sign-off route"
  );
  assert.match(
    completionCloseReportSource,
    /buildCloseReportDistributionSignoffRouteHref/,
    "completion close report component should use distribution sign-off route helper"
  );
  assert.match(
    distributionSignoffPageSource,
    /PayrollYearEndFilingOpsReviewCloseReportDistributionSignoff/,
    "distribution sign-off page should render dedicated component"
  );
  assert.match(
    distributionSignoffSource,
    /id="filing-alert-close-report-distribution-signoff-hub"/,
    "distribution sign-off component should expose root section id"
  );
  assert.match(
    distributionSignoffSource,
    /PayrollYearEndFilingOpsCloseReportDistributionPanel/,
    "distribution sign-off container should compose distribution panel"
  );
  assert.match(
    distributionSignoffSource,
    /PayrollYearEndFilingOpsCloseReportSignoffPanel/,
    "distribution sign-off container should compose sign-off panel"
  );
  assert.match(
    distributionPanelSource,
    /id="filing-alert-close-report-distribution"/,
    "distribution panel should expose panel id"
  );
  assert.match(
    signoffPanelSource,
    /id="filing-alert-close-report-signoff"/,
    "sign-off panel should expose panel id"
  );
  assert.match(
    distributionSignoffSource,
    /id="filing-alert-close-report-distribution-signoff-readiness"/,
    "distribution sign-off component should expose readiness panel id"
  );
  assert.match(
    distributionSignoffSource,
    /aria-label="filing close report distribution signoff blockers"/,
    "distribution sign-off component should expose blocker list aria-label"
  );
  assert.match(
    distributionSignoffHelperSource,
    /summarizeCloseReportDistributionSignoff/,
    "distribution sign-off helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0211 /, "roadmap should include WI-0211 entry");
  assert.match(workItemSource, /distribution sign-off/i, "work-item should include distribution sign-off scope");
  assert.match(workItemSource, /close report/i, "work-item should include close report scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0211-filing-ops-close-report-distribution-signoff-baseline\.test\.ts/,
    "package scripts should include WI-0211 regression test"
  );

  const module = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-report-distribution-signoff.ts"
  );

  const href = module.buildCloseReportDistributionSignoffRouteHref({
    metric: "pending",
    level: "critical",
    value: 17,
    ownerRole: "manager",
    ownerActorId: "MGR-0211",
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
    publicationReady: false
  });
  assert.match(
    href,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\/distribution-signoff\?/,
    "distribution sign-off helper should build dedicated route"
  );
  assert.match(href, /closeReportPublished=1/, "href should include close report published flag");
  assert.match(href, /publicationReady=0/, "href should include publication ready flag");

  const distributionEntries = module.buildDefaultCloseReportDistributionEntries();
  assert.equal(distributionEntries.length, 3);
  assert.equal(distributionEntries[0].status, "pending");

  const confirmedDistribution = module.applyCloseReportDistributionStatus({
    entries: distributionEntries,
    channel: "ops_broadcast",
    status: "confirmed",
    batchId: "BATCH-0211",
    targetGroup: "ops_team",
    note: "confirmed distribution"
  });
  assert.equal(
    confirmedDistribution.find((entry: { channel: string }) => entry.channel === "ops_broadcast")?.status,
    "confirmed"
  );

  const signoffEntries = module.buildDefaultCloseReportSignoffEntries();
  assert.equal(signoffEntries.length, 3);
  assert.equal(signoffEntries[0].status, "pending");

  const signedSignoff = module.applyCloseReportSignoffStatus({
    entries: signoffEntries,
    role: "manager",
    status: "signed",
    actorId: "MGR-0211",
    note: "signed by manager"
  });
  assert.equal(
    signedSignoff.find((entry: { role: string }) => entry.role === "manager")?.status,
    "signed"
  );

  const blockedSummary = module.summarizeCloseReportDistributionSignoff({
    distributionEntries: confirmedDistribution,
    signoffEntries: signedSignoff,
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
    publicationReady: true
  });
  assert.equal(blockedSummary.readyForDistributionSignoff, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readySummary = module.summarizeCloseReportDistributionSignoff({
    distributionEntries: confirmedDistribution.map((entry: any) => ({
      ...entry,
      status: "confirmed",
      batchId: entry.batchId || `BATCH-${entry.channel}`,
      distributedAt: entry.distributedAt || "2026-02-22T18:20:00.000Z",
      confirmedAt: entry.confirmedAt || "2026-02-22T18:21:00.000Z"
    })),
    signoffEntries: signedSignoff.map((entry: any) => ({
      ...entry,
      status: "signed",
      actorId: entry.actorId || `${entry.role}-0211`,
      signedAt: entry.signedAt || "2026-02-22T18:30:00.000Z"
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
    publicationReady: true
  });
  assert.equal(readySummary.distributionReady, true);
  assert.equal(readySummary.signoffReady, true);
  assert.equal(readySummary.readyForDistributionSignoff, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0211-filing-ops-close-report-distribution-signoff-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
