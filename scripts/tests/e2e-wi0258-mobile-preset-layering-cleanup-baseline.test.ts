import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const guide = readUtf8("CLAUDE.md");
  const workItem = readUtf8("work-items", "WI-0258-mobile-preset-layering-cleanup-baseline.md");
  const notificationScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationHistoryScreen.js");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const notificationLib = readUtf8("apps", "mobile", "src", "lib", "notificationHistory.js");
  const notificationStore = readUtf8("apps", "mobile", "src", "lib", "notificationStore.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const requestStore = readUtf8("apps", "mobile", "src", "lib", "employeeRequestStore.js");

  assert.match(roadmap, /WI-0258/);
  assert.match(workItem, /Mobile Preset Layering Cleanup Baseline/);
  assert.match(guide, /docs\/codex-guide\.md/);

  assert.match(notificationScreen, /Bulk actions/);
  assert.match(notificationScreen, /Filters/);
  assert.doesNotMatch(notificationScreen, /Quick presets|Pinned presets|Recent presets|Preset transfer/);
  assert.doesNotMatch(notificationScreen, /loadNotificationHistoryPresetState|saveNotificationHistoryPresetState/);

  assert.match(followUpScreen, /Action inbox/);
  assert.match(followUpScreen, /Follow-up snapshot/);
  assert.doesNotMatch(followUpScreen, /Recommendation templates|Action bundle presets|preset transfer/);

  assert.doesNotMatch(notificationLib, /PRESET/);
  assert.doesNotMatch(notificationStore, /history\.preset-state|loadNotificationHistoryPresetState|saveNotificationHistoryPresetState/);
  assert.doesNotMatch(requestLib, /TEMPLATE_OPTIONS|BUNDLE_PRESET|PRESET_TRANSFER|preset/i);
  assert.doesNotMatch(requestStore, /follow-up\.preset|loadEmployeeRequestFollowUpPresetState|saveEmployeeRequestFollowUpPresetState/);

  const notificationTransferPath = join(process.cwd(), "apps", "mobile", "src", "components", "NotificationPresetTransferCard.js");
  const followUpTransferPath = join(
    process.cwd(),
    "apps",
    "mobile",
    "src",
    "components",
    "EmployeeRequestFollowUpPresetTransferCard.js"
  );
  assert.equal(existsSync(notificationTransferPath), false, "NotificationPresetTransferCard should be deleted");
  assert.equal(existsSync(followUpTransferPath), false, "EmployeeRequestFollowUpPresetTransferCard should be deleted");

  assert.ok(
    countLines(notificationScreen) <= 300,
    `NotificationHistoryScreen.js should stay under 300 lines (current: ${countLines(notificationScreen)})`
  );
  assert.ok(
    countLines(followUpScreen) <= 430,
    `EmployeeRequestFollowUpScreen.js should stay under 430 lines (current: ${countLines(followUpScreen)})`
  );
}

run()
  .then(() => {
    console.log("e2e-wi0258-mobile-preset-layering-cleanup-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
