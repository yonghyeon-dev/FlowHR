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
  const workItem = readUtf8("work-items", "WI-0246-mobile-notification-history-quick-preset-filters-baseline.md");
  const cleanupItem = readUtf8("work-items", "WI-0258-mobile-preset-layering-cleanup-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(workItem, /DEPRECATED \(WI-0258\)/);
  assert.match(cleanupItem, /Mobile Preset Layering Cleanup Baseline/);

  assert.doesNotMatch(historyScreen, /Quick presets/);
  assert.doesNotMatch(historyScreen, /active preset/);
  assert.doesNotMatch(historyScreen, /NOTIFICATION_HISTORY_PRESET_FILTERS/);
  assert.doesNotMatch(historyScreen, /setActivePreset/);

  assert.doesNotMatch(historyLib, /NOTIFICATION_HISTORY_PRESET_FILTERS/);
  assert.doesNotMatch(historyLib, /getNotificationPresetFilter/);
  assert.doesNotMatch(historyLib, /buildNotificationPresetCounts/);
  assert.match(historyLib, /filterNotificationHistory/);
  assert.match(historyLib, /applyNotificationBulkAction/);

  assert.doesNotMatch(readme, /notification history quick preset filters/);
  assert.ok(
    countLines(historyScreen) <= 300,
    `NotificationHistoryScreen.js should stay under 300 lines after cleanup (current: ${countLines(historyScreen)})`
  );
}

run()
  .then(() => {
    console.log("e2e-wi0246-mobile-notification-history-quick-preset-filters-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
