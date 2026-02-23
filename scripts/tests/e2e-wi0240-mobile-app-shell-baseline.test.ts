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
  const workItem = readUtf8("work-items", "WI-0240-mobile-app-shell-baseline.md");
  const mobilePackage = readUtf8("apps", "mobile", "package.json");
  const appJson = readUtf8("apps", "mobile", "app.json");
  const appEntry = readUtf8("apps", "mobile", "App.js");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const loginScreen = readUtf8("apps", "mobile", "src", "screens", "LoginScreen.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const sessionStore = readUtf8("apps", "mobile", "src", "lib", "sessionStore.js");
  const apiClient = readUtf8("apps", "mobile", "src", "lib", "flowhrApi.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0240/);
  assert.match(workItem, /Mobile App Shell Baseline/);

  assert.match(mobilePackage, /"start": "expo start"/);
  assert.match(mobilePackage, /"android": "expo run:android"/);
  assert.match(mobilePackage, /"ios": "expo run:ios"/);
  assert.match(mobilePackage, /"web": "expo start --web"/);
  assert.match(mobilePackage, /"expo-secure-store"/);
  assert.match(mobilePackage, /"@react-navigation\/native"/);
  assert.match(mobilePackage, /"react-native"/);

  assert.match(appJson, /"slug": "flowhr-mobile"/);
  assert.match(appEntry, /RootNavigator/);
  assert.match(readme, /FlowHR Mobile \(WI-0240\)/);

  assert.match(navigator, /LoginScreen/);
  assert.match(navigator, /AdminHomeScreen/);
  assert.match(navigator, /EmployeeHomeScreen/);
  assert.match(navigator, /loadSession/);
  assert.match(navigator, /saveSession/);
  assert.match(navigator, /clearSession/);

  assert.match(loginScreen, /Session Bootstrapping/);
  assert.match(loginScreen, /role/);
  assert.match(loginScreen, /accessToken/);

  assert.match(sessionStore, /expo-secure-store/);
  assert.match(sessionStore, /flowhr\.mobile\.session\.v1/);

  assert.match(apiClient, /x-tenant-id/);
  assert.match(apiClient, /x-actor-id/);
  assert.match(apiClient, /authorization/);
  assert.match(apiClient, /createFlowHrApiClient/);

  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );
  assert.ok(
    countLines(loginScreen) <= 300,
    `LoginScreen.js should stay under 300 lines (current: ${countLines(loginScreen)})`
  );
  assert.ok(
    countLines(adminScreen) <= 300,
    `AdminHomeScreen.js should stay under 300 lines (current: ${countLines(adminScreen)})`
  );
  assert.ok(
    countLines(employeeScreen) <= 300,
    `EmployeeHomeScreen.js should stay under 300 lines (current: ${countLines(employeeScreen)})`
  );
}

run();
console.log("e2e-wi0240-mobile-app-shell-baseline.test passed");
