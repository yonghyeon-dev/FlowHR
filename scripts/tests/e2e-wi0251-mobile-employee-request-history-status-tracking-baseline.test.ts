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
  const workItem = readUtf8("work-items", "WI-0251-mobile-employee-request-history-status-tracking-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const employeeHome = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const submitScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestSubmitScreen.js");
  const historyScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestHistoryScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const requestStore = readUtf8("apps", "mobile", "src", "lib", "employeeRequestStore.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0251/);
  assert.match(workItem, /Mobile Employee Request History\/Status Tracking Baseline/);
  assert.match(navigator, /EmployeeRequestHistoryScreen/);
  assert.match(navigator, /name=\"EmployeeRequestHistory\"/);
  assert.match(navigator, /onOpenRequestHistory/);
  assert.match(employeeHome, /onOpenRequestHistory/);
  assert.match(submitScreen, /Open request history/);
  assert.match(historyScreen, /Request History/);
  assert.match(historyScreen, /Filters and sort/);
  assert.match(historyScreen, /STATUS_ACTIONS/);
  assert.match(historyScreen, /timeline:/);
  assert.match(requestLib, /EMPLOYEE_REQUEST_STATUS_OPTIONS/);
  assert.match(requestLib, /filterEmployeeRequests/);
  assert.match(requestLib, /sortEmployeeRequests/);
  assert.match(requestLib, /applyEmployeeRequestStatus/);
  assert.match(requestLib, /normalizeEmployeeRequestRecord/);
  assert.match(requestStore, /normalizeEmployeeRequestRecord/);
  assert.match(adminScreen, /WI-0256~/);
  assert.match(employeeHome, /WI-0256~/);
  assert.match(readme, /Employee request history\/status shell/);

  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );
  assert.ok(
    countLines(submitScreen) <= 320,
    `EmployeeRequestSubmitScreen.js should stay under 320 lines (current: ${countLines(submitScreen)})`
  );
  assert.ok(
    countLines(historyScreen) <= 320,
    `EmployeeRequestHistoryScreen.js should stay under 320 lines (current: ${countLines(historyScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const requestModule = await import("../../apps/mobile/src/lib/employeeRequest.js");
  const {
    applyEmployeeRequestStatus,
    createEmployeeRequestRecord,
    filterEmployeeRequests,
    formatEmployeeRequestStatus,
    sortEmployeeRequests
  } = requestModule;

  const base = createEmployeeRequestRecord(
    {
      requestType: "attendanceCorrection",
      requestDate: "2026-02-23",
      reason: "Missed checkout"
    },
    "employee-001",
    new Date("2026-02-23T09:00:00.000Z")
  );
  const next = applyEmployeeRequestStatus([base], base.id, "inReview", new Date("2026-02-23T09:10:00.000Z"));
  assert.equal(next[0].status, "inReview");
  assert.equal(next[0].statusTimeline.length, 2);
  assert.equal(formatEmployeeRequestStatus(next[0].status), "In review");

  const filtered = filterEmployeeRequests(
    [
      next[0],
      { ...next[0], id: "req-2", status: "approved", reason: "Approved sample", createdAt: "2026-02-23T09:20:00.000Z" }
    ],
    { status: "approved", query: "approved" }
  );
  assert.equal(filtered.length, 1);

  const sorted = sortEmployeeRequests(
    [
      { ...next[0], id: "req-3", createdAt: "2026-02-23T09:30:00.000Z" },
      { ...next[0], id: "req-4", createdAt: "2026-02-23T09:40:00.000Z" }
    ],
    "newest"
  );
  assert.equal(sorted[0].id, "req-4");
}

run()
  .then(() => {
    console.log("e2e-wi0251-mobile-employee-request-history-status-tracking-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
