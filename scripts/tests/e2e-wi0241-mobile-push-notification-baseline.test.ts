import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0241-mobile-push-notification-baseline.md");
  const mobilePackage = readUtf8("apps", "mobile", "package.json");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const notificationScreen = readUtf8("apps", "mobile", "src", "screens", "NotificationCenterScreen.js");
  const notificationLib = readUtf8("apps", "mobile", "src", "lib", "notifications.js");
  const notificationStore = readUtf8("apps", "mobile", "src", "lib", "notificationStore.js");

  assert.match(roadmap, /WI-0241/);
  assert.match(workItem, /Mobile Push Notification Baseline/);

  assert.match(mobilePackage, /"expo-notifications"/);
  assert.match(mobilePackage, /"expo-device"/);

  assert.match(navigator, /NotificationCenterScreen/);
  assert.match(navigator, /name="Notifications"/);
  assert.match(adminScreen, /알림 센터 열기/);
  assert.match(employeeScreen, /알림 센터 열기/);

  assert.match(notificationScreen, /requestPushPermissionAsync/);
  assert.match(notificationScreen, /registerDevicePushTokenAsync/);
  assert.match(notificationScreen, /togglePreference/);
  assert.match(notificationScreen, /markAllRead/);

  assert.match(notificationLib, /setNotificationHandler/);
  assert.match(notificationLib, /registerDevicePushTokenAsync/);
  assert.match(notificationLib, /permissionLabel/);
  assert.match(notificationStore, /defaultNotificationPreference/);
  assert.match(notificationStore, /flowhr\.mobile\.notification\.preference\.v1/);
  assert.match(notificationStore, /flowhr\.mobile\.notification\.inbox\.v1/);

  assert.ok(
    countLines(notificationScreen) <= 300,
    `NotificationCenterScreen.js should stay under 300 lines (current: ${countLines(notificationScreen)})`
  );
  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );
}

run();
console.log("e2e-wi0241-mobile-push-notification-baseline.test passed");
