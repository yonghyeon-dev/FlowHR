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
  const workItem = readUtf8("work-items", "WI-0247-mobile-notification-history-preset-pin-recent-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const store = readUtf8("apps", "mobile", "src", "lib", "notificationStore.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0247/);
  assert.match(workItem, /Mobile Notification History Preset Pin\/Recent Baseline/);
  assert.match(historyScreen, /Pinned presets/);
  assert.match(historyScreen, /Recent presets/);
  assert.match(historyScreen, /togglePresetPin/);
  assert.match(historyScreen, /loadNotificationHistoryPresetState/);
  assert.match(historyScreen, /saveNotificationHistoryPresetState/);
  assert.match(historyScreen, /pushNotificationPresetRecent/);

  assert.match(historyLib, /sanitizeNotificationPresetKeys/);
  assert.match(historyLib, /toggleNotificationPresetPin/);
  assert.match(historyLib, /pushNotificationPresetRecent/);
  assert.match(historyLib, /NOTIFICATION_HISTORY_PRESET_RECENT_LIMIT/);

  assert.match(store, /HISTORY_PRESET_STATE_KEY/);
  assert.match(store, /defaultNotificationHistoryPresetState/);
  assert.match(store, /loadNotificationHistoryPresetState/);
  assert.match(store, /saveNotificationHistoryPresetState/);

  assert.match(adminScreen, /WI-0253~/);
  assert.match(employeeScreen, /WI-0253~/);
  assert.match(readme, /notification history preset pin\/recent persistence/);

  assert.ok(
    countLines(historyScreen) <= 320,
    `NotificationHistoryScreen.js should stay under 320 lines (current: ${countLines(historyScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const historyModule = await import("../../apps/mobile/src/lib/notificationHistory.js");
  const {
    NOTIFICATION_HISTORY_PRESET_RECENT_LIMIT,
    pushNotificationPresetRecent,
    sanitizeNotificationPresetKeys,
    toggleNotificationPresetPin
  } = historyModule;

  const sanitized = sanitizeNotificationPresetKeys(["allOpen", "invalid", "allOpen", "archived"]);
  assert.deepEqual(sanitized, ["allOpen", "archived"]);

  const pinnedAdded = toggleNotificationPresetPin(["allOpen"], "approvalUnread");
  assert.deepEqual(pinnedAdded, ["allOpen", "approvalUnread"]);

  const pinnedRemoved = toggleNotificationPresetPin(pinnedAdded, "allOpen");
  assert.deepEqual(pinnedRemoved, ["approvalUnread"]);

  const recent = pushNotificationPresetRecent(["resultUnread", "allOpen"], "resultUnread");
  assert.deepEqual(recent[0], "resultUnread");

  const capped = pushNotificationPresetRecent(
    ["allOpen", "approvalUnread", "resultUnread", "payslipUnread", "archived"],
    "allOpen"
  );
  assert.ok(capped.length <= NOTIFICATION_HISTORY_PRESET_RECENT_LIMIT);
}

run()
  .then(() => {
    console.log("e2e-wi0247-mobile-notification-history-preset-pin-recent-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
