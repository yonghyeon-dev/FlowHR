import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const checklistPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist",
    "page.tsx"
  );
  const checklistTrackerSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsChecklistTracker.tsx"
  );
  const checklistTrackerCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsChecklistTracker.module.css"
  );
  const filingOpsDashboardSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsDashboard.tsx"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0202-filing-ops-alert-execution-checklist-and-completion-tracking-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist/,
    "admin nav should include filing ops checklist route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklist/,
    "messages should include filing ops checklist nav key"
  );
  assert.match(
    checklistPageSource,
    /PayrollYearEndFilingOpsChecklistTracker/,
    "checklist page should render dedicated tracker component"
  );
  assert.match(
    checklistTrackerSource,
    /id="filing-alert-execution-checklist"/,
    "checklist tracker should expose section id"
  );
  assert.match(
    checklistTrackerSource,
    /aria-label="filing alert execution checklist"/,
    "checklist tracker should expose checklist aria-label"
  );
  assert.match(
    checklistTrackerSource,
    /buildAlertExecutionChecklistRows/,
    "checklist tracker should expose deterministic checklist builder"
  );
  assert.match(
    checklistTrackerSource,
    /summarizeAlertExecutionChecklistProgress/,
    "checklist tracker should expose completion summary helper"
  );
  assert.match(
    filingOpsDashboardSource,
    /Open Checklist/,
    "ops dashboard should provide quick link to checklist tracker"
  );
  assert.match(
    checklistTrackerCssModuleSource,
    /\.checklistRow/,
    "checklist css module should include checklist row style"
  );
  assert.match(
    checklistTrackerCssModuleSource,
    /\.alertExecutionControls/,
    "checklist css module should include checklist controls style"
  );
  assert.match(
    roadmapSource,
    /> \*\*Current version\*\*: 0\.1\.\d+/,
    "roadmap should expose current version header"
  );
  assert.match(roadmapSource, /WI-0202 /, "roadmap should include WI-0202 entry");
  assert.match(workItemSource, /completion tracking/i, "work-item should describe completion tracking");
  assert.match(
    packageJsonSource,
    /e2e-wi0202-filing-ops-alert-execution-checklist-and-completion-tracking-baseline\.test\.ts/,
    "package scripts should include WI-0202 regression test"
  );

  const checklistModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-execution-checklist.ts"
  );

  const rows = checklistModule.buildAlertExecutionChecklistRows({
    metric: "rejected",
    level: "critical",
    ownerRole: "manager",
    ownerActorId: "MGR-0202",
    currentValue: 4
  });
  assert.equal(rows.length, 3, "critical rejected checklist should have three baseline tasks");
  assert.ok(
    rows.every((row: { taskId: string }) => row.taskId.startsWith("rejected:")),
    "rejected metric checklist ids should be namespaced"
  );
  assert.ok(
    rows.every((row: { required: boolean }) => row.required),
    "critical level checklist should mark all tasks as required"
  );
  assert.ok(
    rows.some((row: { detail: string }) => row.detail.includes("MGR-0202")),
    "task detail should include assigned owner context"
  );

  const emptyProgress = checklistModule.summarizeAlertExecutionChecklistProgress([], []);
  assert.deepEqual(emptyProgress, {
    totalCount: 0,
    completedCount: 0,
    pendingCount: 0,
    completionRate: 0
  });

  const firstTaskOnly = checklistModule.summarizeAlertExecutionChecklistProgress(rows, [rows[0].taskId]);
  assert.equal(firstTaskOnly.totalCount, 3);
  assert.equal(firstTaskOnly.completedCount, 1);
  assert.equal(firstTaskOnly.pendingCount, 2);
  assert.equal(firstTaskOnly.completionRate, 33);

  const fullProgress = checklistModule.summarizeAlertExecutionChecklistProgress(
    rows,
    rows.map((row: { taskId: string }) => row.taskId)
  );
  assert.equal(fullProgress.totalCount, 3);
  assert.equal(fullProgress.completedCount, 3);
  assert.equal(fullProgress.pendingCount, 0);
  assert.equal(fullProgress.completionRate, 100);
}

run()
  .then(() => {
    console.log("e2e-wi0202-filing-ops-alert-execution-checklist-and-completion-tracking-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
