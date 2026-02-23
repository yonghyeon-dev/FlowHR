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
  const workItem = readUtf8("work-items", "WI-0244-mobile-notification-history-search-archive-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const centerScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationCenterScreen.js");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0244/);
  assert.match(workItem, /Mobile Notification History Search\/Archive Baseline/);
  assert.match(navigator, /NotificationHistoryScreen/);
  assert.match(navigator, /name=\"NotificationHistory\"/);
  assert.match(adminScreen, /onOpenNotificationHistory/);
  assert.match(employeeScreen, /onOpenNotificationHistory/);
  assert.match(adminScreen, /WI-0254~/);
  assert.match(employeeScreen, /WI-0254~/);

  assert.match(centerScreen, /filterNotificationHistory/);
  assert.match(centerScreen, /onOpenHistory/);
  assert.match(centerScreen, /History search\/archive/);

  assert.match(historyScreen, /Search/);
  assert.match(historyScreen, /Archive state/);
  assert.match(historyScreen, /toggleArchive/);
  assert.match(historyLib, /filterNotificationHistory/);
  assert.match(historyLib, /buildNotificationHistoryStats/);
  assert.match(historyLib, /toggleNotificationArchive/);
  assert.match(readme, /notification history search\/archive/);

  assert.ok(
    countLines(centerScreen) <= 300,
    `NotificationCenterScreen.js should stay under 300 lines (current: ${countLines(centerScreen)})`
  );
  assert.ok(
    countLines(historyScreen) <= 320,
    `NotificationHistoryScreen.js should stay under 320 lines (current: ${countLines(historyScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const historyModule = await import("../../apps/mobile/src/lib/notificationHistory.js");
  const { filterNotificationHistory, buildNotificationHistoryStats, toggleNotificationArchive } = historyModule;

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
      read: true,
      archivedAt: "2026-02-23T08:00:00.000Z"
    }
  ];

  const filteredByQuery = filterNotificationHistory(sample, { query: "queue", archiveState: "all" });
  assert.equal(filteredByQuery.length, 1);
  assert.equal(filteredByQuery[0].id, "1");

  const filteredActive = filterNotificationHistory(sample, { archiveState: "active" });
  assert.equal(filteredActive.length, 1);
  assert.equal(filteredActive[0].id, "1");

  const stats = buildNotificationHistoryStats(sample);
  assert.equal(stats.total, 2);
  assert.equal(stats.active, 1);
  assert.equal(stats.archived, 1);
  assert.equal(stats.unread, 1);

  const archived = toggleNotificationArchive(sample, "1", true, new Date("2026-02-23T09:00:00.000Z"));
  assert.equal(archived[0].archivedAt, "2026-02-23T09:00:00.000Z");

  const unarchived = toggleNotificationArchive(archived, "1", false, new Date("2026-02-23T10:00:00.000Z"));
  assert.equal(unarchived[0].archivedAt, null);
}

run()
  .then(() => {
    console.log("e2e-wi0244-mobile-notification-history-search-archive-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
