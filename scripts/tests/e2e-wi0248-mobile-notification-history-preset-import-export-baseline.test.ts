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
  const workItem = readUtf8("work-items", "WI-0248-mobile-notification-history-preset-import-export-baseline.md");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const transferCard = readUtf8("apps", "mobile", "src", "components", "NotificationPresetTransferCard.js");
  const historyLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const store = readUtf8("apps", "mobile", "src", "lib", "notificationStore.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0248/);
  assert.match(workItem, /Mobile Notification History Preset Import\/Export Baseline/);
  assert.match(historyScreen, /NotificationPresetTransferCard/);
  assert.match(historyScreen, /onImportPresetState/);
  assert.match(transferCard, /Preset transfer/);
  assert.match(transferCard, /Generate export payload/);
  assert.match(transferCard, /Import payload/);
  assert.match(historyLib, /serializeNotificationHistoryPresetState/);
  assert.match(historyLib, /parseNotificationHistoryPresetState/);
  assert.match(historyLib, /NOTIFICATION_HISTORY_PRESET_TRANSFER_TYPE/);
  assert.match(store, /HISTORY_PRESET_STATE_KEY/);
  assert.match(adminScreen, /WI-0255~/);
  assert.match(employeeScreen, /WI-0255~/);
  assert.match(readme, /notification history preset import\/export/);

  assert.ok(
    countLines(historyScreen) <= 320,
    `NotificationHistoryScreen.js should stay under 320 lines (current: ${countLines(historyScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const historyModule = await import("../../apps/mobile/src/lib/notificationHistory.js");
  const {
    NOTIFICATION_HISTORY_PRESET_TRANSFER_TYPE,
    NOTIFICATION_HISTORY_PRESET_TRANSFER_VERSION,
    parseNotificationHistoryPresetState,
    serializeNotificationHistoryPresetState
  } = historyModule;

  const payload = serializeNotificationHistoryPresetState({
    pinnedPresetKeys: ["allOpen", "approvalUnread"],
    recentPresetKeys: ["resultUnread", "allOpen"]
  });
  assert.match(payload, new RegExp(NOTIFICATION_HISTORY_PRESET_TRANSFER_TYPE));

  const parsed = parseNotificationHistoryPresetState(payload);
  assert.equal(parsed.ok, true);
  assert.deepEqual(parsed.state.pinnedPresetKeys, ["allOpen", "approvalUnread"]);
  assert.deepEqual(parsed.state.recentPresetKeys, ["resultUnread"]);

  const invalid = parseNotificationHistoryPresetState("{broken");
  assert.equal(invalid.ok, false);
  assert.equal(invalid.code, "invalid_json");

  const wrongVersion = parseNotificationHistoryPresetState(
    JSON.stringify({
      type: NOTIFICATION_HISTORY_PRESET_TRANSFER_TYPE,
      version: NOTIFICATION_HISTORY_PRESET_TRANSFER_VERSION + 1,
      state: { pinnedPresetKeys: ["allOpen"], recentPresetKeys: [] }
    })
  );
  assert.equal(wrongVersion.ok, false);
  assert.equal(wrongVersion.code, "unsupported_version");

  const legacy = parseNotificationHistoryPresetState(
    JSON.stringify({ pinnedPresetKeys: ["allOpen"], recentPresetKeys: ["allOpen", "archived"] })
  );
  assert.equal(legacy.ok, true);
  assert.deepEqual(legacy.state.recentPresetKeys, ["archived"]);
}

run()
  .then(() => {
    console.log("e2e-wi0248-mobile-notification-history-preset-import-export-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
