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
  const workItem = readUtf8("work-items", "WI-0245-mobile-notification-history-bulk-actions-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0245/);
  assert.match(workItem, /Mobile Notification History Bulk Actions Baseline/);
  assert.match(historyScreen, /Bulk actions/);
  assert.match(historyScreen, /Select visible/);
  assert.match(historyScreen, /Mark read selected/);
  assert.match(historyScreen, /Archive selected/);
  assert.match(historyScreen, /Unarchive selected/);
  assert.match(historyScreen, /selectedIds/);
  assert.match(historyScreen, /toggleSelection/);
  assert.match(historyScreen, /applyBulkAction/);

  assert.match(historyLib, /applyNotificationBulkAction/);
  assert.match(historyLib, /mergeNotificationSelection/);
  assert.match(historyLib, /pruneNotificationSelection/);
  assert.match(adminScreen, /WI-0253~/);
  assert.match(employeeScreen, /WI-0253~/);
  assert.match(readme, /notification history bulk actions/);

  assert.ok(
    countLines(historyScreen) <= 320,
    `NotificationHistoryScreen.js should stay under 320 lines (current: ${countLines(historyScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const historyModule = await import("../../apps/mobile/src/lib/notificationHistory.js");
  const {
    applyNotificationBulkAction,
    mergeNotificationSelection,
    pruneNotificationSelection
  } = historyModule;

  const sample = [
    {
      id: "1",
      title: "Approval request arrived",
      body: "Queue item",
      category: "approvalRequest",
      createdAt: "2026-02-23T06:00:00.000Z",
      read: false,
      archivedAt: null
    },
    {
      id: "2",
      title: "Payslip issued",
      body: "Ready to read",
      category: "payslipReady",
      createdAt: "2026-02-22T23:00:00.000Z",
      read: false,
      archivedAt: "2026-02-23T08:00:00.000Z"
    }
  ];

  const markedRead = applyNotificationBulkAction(sample, ["1", "2"], "markRead", new Date("2026-02-23T09:00:00.000Z"));
  assert.equal(markedRead[0].read, true);
  assert.equal(markedRead[1].read, true);

  const archived = applyNotificationBulkAction(sample, ["1"], "archive", new Date("2026-02-23T09:00:00.000Z"));
  assert.equal(archived[0].archivedAt, "2026-02-23T09:00:00.000Z");

  const unarchived = applyNotificationBulkAction(sample, ["2"], "unarchive", new Date("2026-02-23T09:00:00.000Z"));
  assert.equal(unarchived[1].archivedAt, null);

  const merged = mergeNotificationSelection({ "1": true }, ["2", "3"]);
  assert.equal(Boolean(merged["1"]), true);
  assert.equal(Boolean(merged["2"]), true);
  assert.equal(Boolean(merged["3"]), true);

  const pruned = pruneNotificationSelection({ "1": true, "2": true, "x": true }, sample);
  assert.equal(Boolean(pruned["1"]), true);
  assert.equal(Boolean(pruned["2"]), true);
  assert.equal(Boolean(pruned["x"]), false);
}

run()
  .then(() => {
    console.log("e2e-wi0245-mobile-notification-history-bulk-actions-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
