import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const handoffSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewHandoffExportSnapshot.tsx"
  );
  const closeOffPageSource = readUtf8(
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
    "page.tsx"
  );
  const closeOffSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseOffPackage.tsx"
  );
  const closeOffCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsReviewCloseOffPackage.module.css"
  );
  const closeOffHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-review-close-off-package.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0206-filing-ops-close-off-package-and-audit-signoff-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off/,
    "admin nav should include close-off package route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistReviewCloseOff/,
    "messages should include close-off package nav key"
  );
  assert.match(
    handoffSource,
    /Open Close-off Package/,
    "handoff snapshot should provide link to close-off package route"
  );
  assert.match(
    handoffSource,
    /buildReviewCloseOffRouteHref/,
    "handoff snapshot should use close-off route helper"
  );
  assert.match(
    closeOffPageSource,
    /PayrollYearEndFilingOpsReviewCloseOffPackage/,
    "close-off page should render dedicated component"
  );
  assert.match(
    closeOffSource,
    /id="filing-alert-review-close-off-package"/,
    "close-off component should expose root section id"
  );
  assert.match(
    closeOffSource,
    /id="filing-alert-audit-signoff-grid"/,
    "close-off component should expose sign-off grid panel id"
  );
  assert.match(
    closeOffSource,
    /id="filing-alert-close-off-package-archive"/,
    "close-off component should expose archive panel id"
  );
  assert.match(
    closeOffSource,
    /id="filing-alert-close-off-readiness"/,
    "close-off component should expose readiness panel id"
  );
  assert.match(
    closeOffSource,
    /aria-label="filing close-off blockers"/,
    "close-off component should expose blocker list aria-label"
  );
  assert.match(
    closeOffCssModuleSource,
    /\.signOffGrid/,
    "close-off css module should include sign-off grid style"
  );
  assert.match(
    closeOffCssModuleSource,
    /\.archiveCard/,
    "close-off css module should include archive card style"
  );
  assert.match(
    closeOffHelperSource,
    /summarizeCloseOffPackage/,
    "close-off helper should expose deterministic summary function"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0206 /, "roadmap should include WI-0206 entry");
  assert.match(workItemSource, /close-off/i, "work-item should include close-off scope");
  assert.match(workItemSource, /sign-off/i, "work-item should include sign-off scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0206-filing-ops-close-off-package-and-audit-signoff-baseline\.test\.ts/,
    "package scripts should include WI-0206 regression test"
  );

  const closeOffModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-review-close-off-package.ts"
  );

  const closeOffHref = closeOffModule.buildReviewCloseOffRouteHref({
    metric: "pending",
    level: "critical",
    value: 4,
    ownerRole: "manager",
    ownerActorId: "MGR-0206",
    handoffReady: true,
    exportReady: false
  });
  assert.match(
    closeOffHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\/snapshot\/handoff\/close-off\?/,
    "close-off helper should build dedicated close-off route"
  );
  assert.match(closeOffHref, /handoffReady=1/, "close-off href should include handoff flag");
  assert.match(closeOffHref, /exportReady=0/, "close-off href should include export flag");

  assert.equal(closeOffModule.parseBooleanQueryParam("yes"), true);
  assert.equal(closeOffModule.parseBooleanQueryParam("0"), false);

  const defaults = closeOffModule.buildDefaultAuditSignOffEntries("OPS-0206");
  assert.equal(defaults.length, 3);
  assert.equal(defaults[0].role, "payroll_operator");
  assert.equal(defaults[0].actorId, "OPS-0206");

  const signedManager = closeOffModule.buildAuditSignOffEntry({
    role: "manager",
    status: "signed",
    actorId: " MGR-0206 ",
    note: "  close-off approved  ",
    now: new Date("2026-02-22T13:10:00.000Z")
  });
  assert.equal(signedManager.actorId, "MGR-0206");
  assert.equal(signedManager.note, "close-off approved");
  assert.equal(signedManager.signedAt, "2026-02-22T13:10:00.000Z");

  const updatedEntries = closeOffModule.applyAuditSignOffDecision({
    entries: defaults,
    role: "manager",
    status: "signed",
    actorId: "MGR-0206",
    note: "approved",
    now: new Date("2026-02-22T13:15:00.000Z")
  });
  assert.equal(updatedEntries.find((entry: { role: string }) => entry.role === "manager")?.status, "signed");

  const blockedSummary = closeOffModule.summarizeCloseOffPackage({
    entries: updatedEntries,
    handoffReady: false,
    exportReady: false
  });
  assert.equal(blockedSummary.readyToArchive, false);
  assert.equal(blockedSummary.blockers.length >= 1, true);

  const readyEntries = [
    { role: "payroll_operator", status: "signed", actorId: "OPS-0206", note: "", signedAt: "2026-02-22T13:00:00.000Z" },
    { role: "manager", status: "signed", actorId: "MGR-0206", note: "", signedAt: "2026-02-22T13:15:00.000Z" },
    { role: "admin", status: "signed", actorId: "ADM-0206", note: "", signedAt: "2026-02-22T13:20:00.000Z" }
  ] as const;
  const readySummary = closeOffModule.summarizeCloseOffPackage({
    entries: readyEntries,
    handoffReady: true,
    exportReady: true
  });
  assert.equal(readySummary.signedCount, 3);
  assert.equal(readySummary.pendingCount, 0);
  assert.equal(readySummary.rejectedCount, 0);
  assert.equal(readySummary.readyToArchive, true);
  assert.equal(readySummary.blockers.length, 0);
}

run()
  .then(() => {
    console.log("e2e-wi0206-filing-ops-close-off-package-and-audit-signoff-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
