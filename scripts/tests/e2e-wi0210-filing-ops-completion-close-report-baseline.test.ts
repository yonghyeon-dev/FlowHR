import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const completionReceiptSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCompletionReceiptArchiveDigest.tsx"
  );
  const closeReportPageSource = readUtf8(
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
    "page.tsx"
  );
  const closeReportSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCompletionCloseReport.tsx"
  );
  const closeReportPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsCompletionCloseReportPanel.tsx"
  );
  const closeReportPublicationPanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsCloseReportPublicationPanel.tsx"
  );
  const closeReportHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-completion-close-report.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0210-filing-ops-completion-close-report-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report/,
    "admin nav should include completion close report route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistCompletionCloseReport/,
    "messages should include completion close report nav key"
  );
  assert.match(
    completionReceiptSource,
    /Open Completion Close Report/,
    "completion receipt component should link to completion close report route"
  );
  assert.match(
    completionReceiptSource,
    /buildCompletionReceiptCloseReportRouteHref/,
    "completion receipt component should use completion close report helper"
  );
  assert.match(
    closeReportPageSource,
    /PayrollYearEndFilingOpsReviewCompletionCloseReport/,
    "completion close report page should render dedicated component"
  );
  assert.match(
    closeReportSource,
    /id="filing-alert-completion-close-report-hub"/,
    "completion close report component should expose root section id"
  );
  assert.match(
    closeReportSource,
    /PayrollYearEndFilingOpsCompletionCloseReportPanel/,
    "completion close report container should compose close report panel"
  );
  assert.match(
    closeReportSource,
    /PayrollYearEndFilingOpsCloseReportPublicationPanel/,
    "completion close report container should compose publication panel"
  );
  assert.match(
    closeReportPanelSource,
    /id="filing-alert-completion-close-report"/,
    "completion close report panel should expose close report panel id"
  );
  assert.match(
    closeReportPublicationPanelSource,
    /id="filing-alert-close-report-publication"/,
    "completion close report panel should expose publication panel id"
  );
  assert.match(
    closeReportSource,
    /id="filing-alert-close-report-readiness"/,
    "completion close report component should expose readiness panel id"
  );
  assert.match(
    closeReportSource,
    /aria-label="filing completion close report blockers"/,
    "completion close report component should expose blocker list aria-label"
  );
  assert.match(
    closeReportHelperSource,
    /summarizeCompletionCloseReport/,
    "completion close report helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0210 /, "roadmap should include WI-0210 entry");
  assert.match(workItemSource, /close report/i, "work-item should include close report scope");
  assert.match(workItemSource, /publication/i, "work-item should include publication scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0210-filing-ops-completion-close-report-baseline\.test\.ts/,
    "package scripts should include WI-0210 regression test"
  );

  const closeReportModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-completion-close-report.ts"
  );

  const closeReportHref = closeReportModule.buildCompletionReceiptCloseReportRouteHref({
    metric: "pending",
    level: "critical",
    value: 15,
    ownerRole: "manager",
    ownerActorId: "MGR-0210",
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true,
    receiptVerified: true,
    digestReady: false
  });
  assert.match(
    closeReportHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\/routing-signature\/delivery-lock\/completion-receipt\/close-report\?/,
    "completion close report helper should build dedicated route"
  );
  assert.match(closeReportHref, /receiptVerified=1/, "close report href should include receipt flag");
  assert.match(closeReportHref, /digestReady=0/, "close report href should include digest flag");

  const draftedReport = closeReportModule.buildCompletionCloseReportRecord({
    reportId: " CLOSE-0210 ",
    status: "drafted",
    ownerRole: "manager",
    ownerActorId: " MGR-0210 ",
    summary: "  drafted summary "
  });
  assert.equal(draftedReport.reportId, "CLOSE-0210");
  assert.equal(draftedReport.ownerActorId, "MGR-0210");
  assert.equal(draftedReport.summary, "drafted summary");
  assert.notEqual(draftedReport.draftedAt, null);
  assert.equal(draftedReport.publishedAt, null);

  const publishedReport = closeReportModule.applyCompletionCloseReport({
    current: draftedReport,
    status: "published",
    ownerRole: "admin",
    ownerActorId: " ADM-0210 ",
    summary: "  final published report ",
    now: new Date("2026-02-22T17:20:00.000Z")
  });
  assert.equal(publishedReport.status, "published");
  assert.equal(publishedReport.ownerRole, "admin");
  assert.equal(publishedReport.ownerActorId, "ADM-0210");
  assert.equal(publishedReport.summary, "final published report");
  assert.notEqual(publishedReport.draftedAt, null);
  assert.equal(publishedReport.publishedAt, "2026-02-22T17:20:00.000Z");

  const publicationEntries = closeReportModule.buildDefaultCloseReportPublicationEntries();
  assert.equal(publicationEntries.length, 3);
  assert.equal(publicationEntries[0].status, "pending");

  const queuedPublication = closeReportModule.applyCloseReportPublicationStatus({
    entries: publicationEntries,
    channel: "ops_digest",
    status: "queued",
    artifactId: "ART-0210",
    receiptReference: "RCPT-0210",
    note: "queued for publication",
    now: new Date("2026-02-22T17:30:00.000Z")
  });
  assert.equal(
    queuedPublication.find((entry: { channel: string }) => entry.channel === "ops_digest")?.status,
    "queued"
  );

  const blockedSummary = closeReportModule.summarizeCompletionCloseReport({
    closeReportRecord: draftedReport,
    publicationEntries: queuedPublication,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true,
    receiptVerified: true,
    digestReady: true
  });
  assert.equal(blockedSummary.readyToClose, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const publishedPublicationEntries = queuedPublication.map((entry: any) => ({
    ...entry,
    status: "published",
    artifactId: entry.artifactId || `ART-${entry.channel}`,
    receiptReference: entry.receiptReference || "RCPT-0210",
    updatedAt: entry.updatedAt || "2026-02-22T17:40:00.000Z"
  }));

  const readySummary = closeReportModule.summarizeCompletionCloseReport({
    closeReportRecord: publishedReport,
    publicationEntries: publishedPublicationEntries,
    handoffReady: true,
    exportReady: true,
    archiveReady: true,
    routingReady: true,
    signatureReady: true,
    packageLocked: true,
    handoverAcknowledged: true,
    receiptVerified: true,
    digestReady: true
  });
  assert.equal(readySummary.closeReportPublished, true);
  assert.equal(readySummary.publicationReady, true);
  assert.equal(readySummary.readyToClose, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0210-filing-ops-completion-close-report-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
