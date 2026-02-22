import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const checklistTrackerSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsChecklistTracker.tsx"
  );
  const reviewPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist",
    "review",
    "page.tsx"
  );
  const reviewLoopSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsChecklistReviewLoop.tsx"
  );
  const reviewLoopCssModuleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingOpsChecklistReviewLoop.module.css"
  );
  const reviewHelperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "filing-alert-execution-review-loop.ts"
  );
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0203-filing-ops-alert-checklist-execution-log-and-review-loop-baseline.md"
  );
  const packageJsonSource = readUtf8("package.json");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing\/ops\/checklist\/review/,
    "admin nav should include checklist review loop route"
  );
  assert.match(
    messagesSource,
    /admin\.nav\.yearEndFilingOpsChecklistReview/,
    "messages should include checklist review nav key"
  );
  assert.match(
    checklistTrackerSource,
    /Open Review Loop/,
    "checklist tracker should provide link to review loop"
  );
  assert.match(
    checklistTrackerSource,
    /buildChecklistReviewRouteHref/,
    "checklist tracker should use review-loop route helper"
  );
  assert.match(
    reviewPageSource,
    /PayrollYearEndFilingOpsChecklistReviewLoop/,
    "review page should render dedicated review loop component"
  );
  assert.match(
    reviewLoopSource,
    /id="filing-alert-review-loop"/,
    "review loop should expose section id"
  );
  assert.match(
    reviewLoopSource,
    /id="filing-alert-execution-log"/,
    "review loop should expose execution log panel id"
  );
  assert.match(
    reviewLoopSource,
    /aria-label="filing alert execution log list"/,
    "review loop should expose execution log list aria-label"
  );
  assert.match(
    reviewHelperSource,
    /summarizeAlertExecutionReviewLoop/,
    "review helper should expose deterministic review summary builder"
  );
  assert.match(
    reviewLoopCssModuleSource,
    /\.reviewHeader/,
    "review loop css module should include review header style"
  );
  assert.match(
    reviewLoopCssModuleSource,
    /\.stageBadge/,
    "review loop css module should include stage badge style"
  );
  assert.match(
    roadmapSource,
    /0\.1\.72 \(Filing Ops Alert Checklist Execution Log and Review Loop Baseline\)/,
    "roadmap current version should be bumped for WI-0203"
  );
  assert.match(roadmapSource, /WI-0203 /, "roadmap should include WI-0203 entry");
  assert.match(workItemSource, /review loop/i, "work-item should include review-loop scope");
  assert.match(
    packageJsonSource,
    /e2e-wi0203-filing-ops-alert-checklist-execution-log-and-review-loop-baseline\.test\.ts/,
    "package scripts should include WI-0203 regression test"
  );

  const checklistModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-execution-checklist.ts"
  );
  const reviewModule = await import(
    "../../src/components/payroll-year-end-filing/filing-alert-execution-review-loop.ts"
  );

  const rows = checklistModule.buildAlertExecutionChecklistRows({
    metric: "pending",
    level: "watch",
    ownerRole: "manager",
    ownerActorId: "MGR-0203",
    currentValue: 3
  });
  assert.equal(rows.length, 3, "pending metric should return baseline checklist rows");

  const reviewHref = reviewModule.buildChecklistReviewRouteHref({
    metric: "pending",
    level: "watch",
    value: 3,
    ownerRole: "manager",
    ownerActorId: "MGR-0203"
  });
  assert.match(
    reviewHref,
    /^\/admin\/payroll-year-end-filing\/ops\/checklist\/review\?/,
    "review href should point to dedicated review route"
  );
  assert.match(reviewHref, /metric=pending/, "review href should include metric query");
  assert.match(reviewHref, /ownerActorId=MGR-0203/, "review href should include owner actor query");

  const firstTask = rows[0];
  const blockedLog = reviewModule.buildAlertExecutionLogEntry({
    taskId: firstTask.taskId,
    status: "blocked",
    note: "waiting for corrected artifact",
    actorId: "PAY-0203",
    now: new Date("2026-02-22T09:30:00.000Z")
  });
  assert.equal(blockedLog.logId, `${firstTask.taskId}:blocked:2026-02-22T09:30:00.000Z`);

  const executeStageSummary = reviewModule.summarizeAlertExecutionReviewLoop({
    rows,
    completedTaskIds: [],
    logs: [blockedLog]
  });
  assert.equal(executeStageSummary.stage, "execute");
  assert.equal(executeStageSummary.requiredPending > 0, true);
  assert.equal(executeStageSummary.readyForClose, false);

  const reviewStageSummary = reviewModule.summarizeAlertExecutionReviewLoop({
    rows,
    completedTaskIds: rows.filter((row: { required: boolean }) => row.required).map((row: { taskId: string }) => row.taskId),
    logs: [blockedLog]
  });
  assert.equal(reviewStageSummary.stage, "review");
  assert.equal(reviewStageSummary.blockedCount, 1);
  assert.equal(reviewStageSummary.readyForClose, false);

  const doneLog = reviewModule.buildAlertExecutionLogEntry({
    taskId: firstTask.taskId,
    status: "done",
    note: "artifact corrected and verified",
    actorId: "PAY-0203",
    now: new Date("2026-02-22T10:00:00.000Z")
  });
  const closeStageSummary = reviewModule.summarizeAlertExecutionReviewLoop({
    rows,
    completedTaskIds: rows.filter((row: { required: boolean }) => row.required).map((row: { taskId: string }) => row.taskId),
    logs: [doneLog]
  });
  assert.equal(closeStageSummary.stage, "close");
  assert.equal(closeStageSummary.requiredPending, 0);
  assert.equal(closeStageSummary.readyForClose, true);
}

run()
  .then(() => {
    console.log("e2e-wi0203-filing-ops-alert-checklist-execution-log-and-review-loop-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
