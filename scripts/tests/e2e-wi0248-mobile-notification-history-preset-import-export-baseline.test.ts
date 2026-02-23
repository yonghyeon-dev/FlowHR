import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workItem = readUtf8("work-items", "WI-0248-mobile-notification-history-preset-import-export-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const readme = readUtf8("apps", "mobile", "README.md");
  const transferCardPath = join(
    process.cwd(),
    "apps",
    "mobile",
    "src",
    "components",
    "NotificationPresetTransferCard.js"
  );

  assert.match(workItem, /DEPRECATED \(WI-0258\)/);

  assert.doesNotMatch(historyScreen, /NotificationPresetTransferCard/);
  assert.doesNotMatch(historyScreen, /onImportPresetState/);
  assert.doesNotMatch(historyLib, /serializeNotificationHistoryPresetState/);
  assert.doesNotMatch(historyLib, /parseNotificationHistoryPresetState/);
  assert.doesNotMatch(historyLib, /NOTIFICATION_HISTORY_PRESET_TRANSFER_TYPE/);
  assert.equal(existsSync(transferCardPath), false, "NotificationPresetTransferCard should be removed");
  assert.doesNotMatch(readme, /notification history preset import\/export transfer/);
}

run()
  .then(() => {
    console.log("e2e-wi0248-mobile-notification-history-preset-import-export-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
