import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const snapshotSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewApprovalSnapshot.tsx"
  );
  const handoffPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist",
    "review",
    "snapshot",
    "handoff",
    "page.tsx"
  );
  const handoffSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewHandoffExportSnapshot.tsx"
  );
  const handoffCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewHandoffExportSnapshot.module.css"
  );
  const handoffHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-handoff-export-snapshot.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0205-filing-ops-checklist-review-handoff-and-export-snapshot-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff/,
    "admin nav should include handoff snapshot route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistReviewHandoff/,
    "messages should include handoff snapshot nav key"
  );
  assert.match(
    snapshotSource,
    /Open Handoff \+ Export Snapshot/,
    "approval snapshot should provide link to handoff snapshot route"
  );
  assert.match(
    snapshotSource,
    /buildReviewSnapshotHandoffRouteHref/,
    "approval snapshot should use handoff route helper"
  );
  assert.match(
    handoffPageSource,
    /PayrollYearEndFilingOpsReviewHandoffExportSnapshot/,
    "handoff snapshot page should render dedicated component"
  );
  assert.match(
    handoffSource,
    /id="filing-alert-review-handoff-export-snapshot"/,
    "handoff component should expose root section id"
  );
  assert.match(
    handoffSource,
    /id="filing-alert-review-handoff-packet"/,
    "handoff component should expose handoff packet panel id"
  );
  assert.match(
    handoffSource,
    /id="filing-alert-export-snapshot"/,
    "handoff component should expose export snapshot panel id"
  );
  assert.match(
    handoffSource,
    /id="filing-alert-review-handoff-readiness"/,
    "handoff component should expose readiness panel id"
  );
  assert.match(
    handoffSource,
    /aria-label="filing review handoff readiness reasons"/,
    "handoff component should expose readiness reasons list aria-label"
  );
  assert.match(
    handoffCssModuleSource,
    /\.contextGrid/,
    "handoff css module should include context grid style"
  );
  assert.match(
    handoffCssModuleSource,
    /\.snapshotCard/,
    "handoff css module should include snapshot card style"
  );
  assert.match(
    handoffHelperSource,
    /summarizeReviewHandoffExportSnapshot/,
    "handoff helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0205 /, "roadmap should include WI-0205 entry");
  assert.match(workItemSource, /handoff/i, "work-item should include handoff scope");
  assert.match(workItemSource, /export snapshot/i, "work-item should include export snapshot scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0205-filing-ops-checklist-review-handoff-and-export-snapshot-baseline\.test\.ts/,
    "package scripts should include WI-0205 regression test"
  );

  const handoffModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-handoff-export-snapshot.ts"
  );

  const handoffHref = handoffModule.buildReviewSnapshotHandoffRouteHref({
    metric: "timelineFailure",
    level: "critical",
    value: 3,
    ownerRole: "manager",
    ownerActorId: "MGR-0205",
    approvedCount: 3,
    pendingCount: 0,
    reworkCount: 0,
    totalCount: 3
  });
  assert.match(
    handoffHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\?/,
    "handoff helper should build dedicated handoff snapshot route"
  );
  assert.match(handoffHref, /metric=timelineFailure/, "handoff href should include metric");
  assert.match(handoffHref, /approvedCount=3/, "handoff href should include approval count");

  assert.equal(handoffModule.parseReviewHandoffRole("admin"), "admin");
  assert.equal(handoffModule.parseReviewHandoffRole("unknown"), "manager");

  const handoffPacket = handoffModule.buildReviewHandoffPacket({
    fromRole: "manager",
    fromActorId: " MGR-0205 ",
    toRole: "admin",
    toActorId: " ADM-0205 ",
    note: "  review complete, ready for close  ",
    escalationPath: " ops > admin ",
    dueAt: "2026-02-23T02:00:00.000Z",
    now: new Date("2026-02-22T12:15:00.000Z")
  });
  assert.equal(handoffPacket.handoffId, "handoff:manager:admin:2026-02-22T12:15:00.000Z");
  assert.equal(handoffPacket.fromActorId, "MGR-0205");
  assert.equal(handoffPacket.toActorId, "ADM-0205");
  assert.equal(handoffPacket.note, "review complete, ready for close");

  const exportSnapshot = handoffModule.buildFilingExportSnapshot({
    format: "hometax_csv",
    validationStatus: "pass",
    recordCount: 12,
    checksum: " sha256:0205 ",
    artifactId: " filing-0205 ",
    exportedAt: "2026-02-22T12:25:00.000Z"
  });
  assert.equal(exportSnapshot.format, "hometax_csv");
  assert.equal(exportSnapshot.recordCount, 12);
  assert.equal(exportSnapshot.checksum, "sha256:0205");
  assert.equal(exportSnapshot.artifactId, "filing-0205");

  const blockedSummary = handoffModule.summarizeReviewHandoffExportSnapshot({
    approvedCount: 2,
    pendingCount: 1,
    reworkCount: 0,
    totalCount: 3,
    handoffPacket: null,
    exportSnapshot: null
  });
  assert.equal(blockedSummary.readyToClose, false);
  assert.equal(blockedSummary.reasons.length, 3);

  const closeReadySummary = handoffModule.summarizeReviewHandoffExportSnapshot({
    approvedCount: 3,
    pendingCount: 0,
    reworkCount: 0,
    totalCount: 3,
    handoffPacket,
    exportSnapshot
  });
  assert.equal(closeReadySummary.approvalsReady, true);
  assert.equal(closeReadySummary.handoffReady, true);
  assert.equal(closeReadySummary.exportReady, true);
  assert.equal(closeReadySummary.readyToClose, true);
  assert.equal(closeReadySummary.reasons.length, 0);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0205-filing-ops-checklist-review-handoff-and-export-snapshot-baseline.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
