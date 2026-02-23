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
  const workItem = readUtf8("work-items", "WI-0246-mobile-notification-history-quick-preset-filters-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0246/);
  assert.match(workItem, /Mobile Notification History Quick Preset Filters Baseline/);
  assert.match(historyScreen, /Quick presets/);
  assert.match(historyScreen, /active preset/);
  assert.match(historyScreen, /applyPreset/);
  assert.match(historyScreen, /setActivePreset\(\"custom\"\)/);
  assert.match(historyScreen, /NOTIFICATION_HISTORY_PRESET_FILTERS/);
  assert.match(historyScreen, /buildNotificationPresetCounts/);

  assert.match(historyLib, /NOTIFICATION_HISTORY_PRESET_FILTERS/);
  assert.match(historyLib, /getNotificationPresetFilter/);
  assert.match(historyLib, /buildNotificationPresetCounts/);
  assert.match(adminScreen, /WI-0247~/);
  assert.match(employeeScreen, /WI-0247~/);
  assert.match(readme, /notification history quick preset filters/);

  assert.ok(
    countLines(historyScreen) <= 320,
    `NotificationHistoryScreen.js should stay under 320 lines (current: ${countLines(historyScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const historyModule = await import("../../apps/mobile/src/lib/notificationHistory.js");
  const { getNotificationPresetFilter, buildNotificationPresetCounts } = historyModule;

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
      title: "Approval result done",
      body: "Approved",
      category: "approvalResult",
      createdAt: "2026-02-23T05:00:00.000Z",
      read: false,
      archivedAt: null
    },
    {
      id: "3",
      title: "Payslip issued",
      body: "Ready",
      category: "payslipReady",
      createdAt: "2026-02-22T23:00:00.000Z",
      read: true,
      archivedAt: "2026-02-23T08:00:00.000Z"
    }
  ];

  const archivedPreset = getNotificationPresetFilter("archived");
  assert.equal(archivedPreset.archiveState, "archived");

  const approvalPreset = getNotificationPresetFilter("approvalUnread");
  assert.equal(approvalPreset.category, "approvalRequest");
  assert.equal(approvalPreset.readState, "unread");

  const counts = buildNotificationPresetCounts(sample);
  assert.equal(counts.allOpen, 2);
  assert.equal(counts.approvalUnread, 1);
  assert.equal(counts.resultUnread, 1);
  assert.equal(counts.archived, 1);
}

run()
  .then(() => {
    console.log("e2e-wi0246-mobile-notification-history-quick-preset-filters-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
