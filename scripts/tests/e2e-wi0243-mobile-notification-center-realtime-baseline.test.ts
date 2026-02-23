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
  const workItem = readUtf8("work-items", "WI-0243-mobile-notification-center-realtime-baseline.md");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const notificationScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationCenterScreen.js");
  const notificationFeed = readUtf8("apps", "mobile", "src", "lib", "notificationFeed.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0243/);
  assert.match(workItem, /Mobile Notification Center Realtime Update Baseline/);
  assert.match(adminScreen, /WI-0246~/);
  assert.match(employeeScreen, /WI-0246~/);

  assert.match(notificationScreen, /LIVE_SYNC_MS/);
  assert.match(notificationScreen, /setInterval/);
  assert.match(notificationScreen, /refreshInbox/);
  assert.match(notificationScreen, /liveSyncEnabled/);
  assert.match(notificationScreen, /setActiveCategory/);
  assert.match(notificationScreen, /appendLiveEvent/);
  assert.match(notificationFeed, /buildNotificationCategoryStats/);
  assert.match(notificationFeed, /filterNotificationsByCategory/);
  assert.match(notificationFeed, /appendLiveMockNotification/);
  assert.match(readme, /realtime refresh\/polling/);

  assert.ok(
    countLines(notificationScreen) <= 300,
    `NotificationCenterScreen.js should stay under 300 lines (current: ${countLines(notificationScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const feedModule = await import("../../apps/mobile/src/lib/notificationFeed.js");
  const {
    sortNotificationsNewest,
    filterNotificationsByCategory,
    buildNotificationCategoryStats,
    appendLiveMockNotification,
    formatSyncClock
  } = feedModule;

  const sample = [
    { id: "1", category: "approvalRequest", createdAt: "2026-02-23T06:00:00.000Z", read: false },
    { id: "2", category: "payslipReady", createdAt: "2026-02-22T23:00:00.000Z", read: true }
  ];

  const sorted = sortNotificationsNewest(sample);
  assert.equal(sorted[0].id, "1");

  const filtered = filterNotificationsByCategory(sample, "payslipReady");
  assert.equal(filtered.length, 1);

  const stats = buildNotificationCategoryStats(sample);
  assert.equal(stats.all.total, 2);
  assert.equal(stats.all.unread, 1);
  assert.equal(stats.approvalRequest.unread, 1);

  const appended = appendLiveMockNotification(sample, new Date("2026-02-23T07:00:00.000Z"));
  assert.equal(appended.length, 3);
  assert.equal(appended[0].read, false);
  assert.match(formatSyncClock("2026-02-23T07:00:00.000Z"), /2026-02-23 07:00:00Z/);
}

run()
  .then(() => {
    console.log("e2e-wi0243-mobile-notification-center-realtime-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
