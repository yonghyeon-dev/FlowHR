import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0249-mobile-admin-approval-queue-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const approvalQueueScreen = readUtf8("apps", "mobile", "src", "screens", "ApprovalQueueScreen.js");
  const queueLib = readUtf8("apps", "mobile", "src", "lib", "approvalQueue.js");
  const queueStore = readUtf8("apps", "mobile", "src", "lib", "approvalQueueStore.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0249/);
  assert.match(workItem, /Mobile Admin Approval Queue Baseline/);
  assert.match(navigator, /ApprovalQueueScreen/);
  assert.match(navigator, /name=\"ApprovalQueue\"/);
  assert.match(adminScreen, /onOpenApprovalQueue/);
  assert.match(adminScreen, /승인 대기 보기/);
  assert.match(approvalQueueScreen, /Approval Queue/);
  assert.match(approvalQueueScreen, /Filters and sort/);
  assert.match(approvalQueueScreen, /Approve/);
  assert.match(approvalQueueScreen, /Reject/);
  assert.match(queueLib, /filterApprovalQueue/);
  assert.match(queueLib, /sortApprovalQueue/);
  assert.match(queueLib, /buildApprovalQueueStats/);
  assert.match(queueLib, /applyApprovalQueueDecision/);
  assert.match(queueStore, /flowhr\.mobile\.approval\.queue\.v1/);
  assert.match(queueStore, /loadApprovalQueueItems/);
  assert.match(queueStore, /saveApprovalQueueItems/);
  assert.match(queueStore, /resetApprovalQueueItems/);
  assert.match(adminScreen, /WI-0251~/);
  assert.match(employeeScreen, /WI-0251~/);
  assert.match(readme, /Admin approval queue shell/);

  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );
  assert.ok(
    countLines(adminScreen) <= 300,
    `AdminHomeScreen.js should stay under 300 lines (current: ${countLines(adminScreen)})`
  );
  assert.ok(
    countLines(approvalQueueScreen) <= 320,
    `ApprovalQueueScreen.js should stay under 320 lines (current: ${countLines(approvalQueueScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const queueModule = await import("../../apps/mobile/src/lib/approvalQueue.js");
  const {
    APPROVAL_QUEUE_SEED_ITEMS,
    applyApprovalQueueDecision,
    buildApprovalQueueStats,
    filterApprovalQueue,
    sortApprovalQueue
  } = queueModule;

  const highPriority = filterApprovalQueue(APPROVAL_QUEUE_SEED_ITEMS, { priority: "high" });
  assert.equal(highPriority.length, 2);

  const stalledSorted = sortApprovalQueue(APPROVAL_QUEUE_SEED_ITEMS, "stalledHoursDesc");
  assert.equal(stalledSorted[0].id, "approval-003");

  const stats = buildApprovalQueueStats(APPROVAL_QUEUE_SEED_ITEMS);
  assert.equal(stats.pending, 3);
  assert.equal(stats.highPriorityPending, 2);

  const approved = applyApprovalQueueDecision(APPROVAL_QUEUE_SEED_ITEMS, "approval-001", "approve");
  const approvedItem = approved.find((item: { id: string; status: string; decidedAt: string | null }) => item.id === "approval-001");
  assert.equal(approvedItem.status, "approved");
  assert.ok(approvedItem.decidedAt);
}

run()
  .then(() => {
    console.log("e2e-wi0249-mobile-admin-approval-queue-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
