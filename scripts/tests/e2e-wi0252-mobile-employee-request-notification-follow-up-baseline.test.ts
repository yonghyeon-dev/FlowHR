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
  const workItem = readUtf8("work-items", "WI-0252-mobile-employee-request-notification-follow-up-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const employeeHome = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestHistoryScreen.js");
  const submitScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestSubmitScreen.js");
  const followUpScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestFollowUpScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0252/);
  assert.match(workItem, /Mobile Employee Request Notification\/Follow-Up Baseline/);
  assert.match(navigator, /EmployeeRequestFollowUpScreen/);
  assert.match(navigator, /name="EmployeeRequestFollowUp"/);
  assert.match(navigator, /onOpenRequestFollowUp/);
  assert.match(employeeHome, /onOpenRequestFollowUp/);
  assert.match(historyScreen, /Open follow-up inbox/);
  assert.match(submitScreen, /Open follow-up inbox/);
  assert.match(followUpScreen, /Request Follow-Up/);
  assert.match(followUpScreen, /Action inbox/);
  assert.match(requestLib, /buildEmployeeRequestFollowUps/);
  assert.match(requestLib, /buildEmployeeRequestFollowUpStats/);
  assert.match(requestLib, /filterEmployeeRequestFollowUps/);
  assert.match(requestLib, /sortEmployeeRequestFollowUps/);
  assert.match(adminScreen, /WI-0258~/);
  assert.match(employeeHome, /WI-0258~/);
  assert.match(readme, /Employee request follow-up alert shell/);

  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );
  assert.ok(
    countLines(historyScreen) <= 340,
    `EmployeeRequestHistoryScreen.js should stay under 340 lines (current: ${countLines(historyScreen)})`
  );
  assert.ok(
    countLines(followUpScreen) <= 560,
    `EmployeeRequestFollowUpScreen.js should stay under 560 lines (current: ${countLines(followUpScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const requestModule = await import("../../apps/mobile/src/lib/employeeRequest.js");
  const {
    buildEmployeeRequestFollowUpStats,
    buildEmployeeRequestFollowUps,
    filterEmployeeRequestFollowUps,
    sortEmployeeRequestFollowUps
  } = requestModule;

  const followUps = buildEmployeeRequestFollowUps([
    {
      id: "req-1",
      requestType: "attendanceCorrection",
      status: "submitted",
      reason: "missed checkout",
      createdAt: "2026-02-23T08:00:00.000Z",
      statusTimeline: [{ status: "submitted", at: "2026-02-23T08:00:00.000Z" }]
    },
    {
      id: "req-2",
      requestType: "leaveRequest",
      status: "rejected",
      reason: "vacation overlap",
      createdAt: "2026-02-23T08:20:00.000Z",
      statusTimeline: [{ status: "rejected", at: "2026-02-23T08:30:00.000Z" }]
    },
    {
      id: "req-3",
      requestType: "leaveRequest",
      status: "approved",
      reason: "approved sample",
      createdAt: "2026-02-23T08:40:00.000Z",
      statusTimeline: [{ status: "approved", at: "2026-02-23T08:50:00.000Z" }]
    }
  ]);
  assert.equal(followUps.length, 2);
  assert.equal(followUps[0].requestId, "req-2");

  const stats = buildEmployeeRequestFollowUpStats(followUps);
  assert.equal(stats.total, 2);
  assert.equal(stats.critical, 1);
  assert.equal(stats.watch, 1);
  assert.equal(stats.actionRequired, 2);

  const filtered = filterEmployeeRequestFollowUps(followUps, { severity: "critical", query: "rejected" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].requestId, "req-2");

  const sortedNewest = sortEmployeeRequestFollowUps(followUps, "newest");
  assert.equal(sortedNewest[0].requestId, "req-2");
}

run()
  .then(() => {
    console.log("e2e-wi0252-mobile-employee-request-notification-follow-up-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
