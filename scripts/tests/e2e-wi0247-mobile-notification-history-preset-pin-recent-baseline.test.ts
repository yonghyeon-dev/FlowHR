import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workItem = readUtf8("work-items", "WI-0247-mobile-notification-history-preset-pin-recent-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const store = readUtf8("apps", "mobile", "src", "lib", "notificationStore.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(workItem, /DEPRECATED \(WI-0258\)/);

  assert.doesNotMatch(historyScreen, /Pinned presets/);
  assert.doesNotMatch(historyScreen, /Recent presets/);
  assert.doesNotMatch(historyScreen, /togglePresetPin/);
  assert.doesNotMatch(historyScreen, /loadNotificationHistoryPresetState/);
  assert.doesNotMatch(historyScreen, /saveNotificationHistoryPresetState/);
  assert.doesNotMatch(historyScreen, /pushNotificationPresetRecent/);

  assert.doesNotMatch(historyLib, /sanitizeNotificationPresetKeys/);
  assert.doesNotMatch(historyLib, /toggleNotificationPresetPin/);
  assert.doesNotMatch(historyLib, /pushNotificationPresetRecent/);
  assert.doesNotMatch(historyLib, /NOTIFICATION_HISTORY_PRESET_RECENT_LIMIT/);

  assert.doesNotMatch(store, /HISTORY_PRESET_STATE_KEY/);
  assert.doesNotMatch(store, /loadNotificationHistoryPresetState/);
  assert.doesNotMatch(store, /saveNotificationHistoryPresetState/);
  assert.doesNotMatch(readme, /notification history preset pin\/recent persistence/);
}

run()
  .then(() => {
    console.log("e2e-wi0247-mobile-notification-history-preset-pin-recent-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
