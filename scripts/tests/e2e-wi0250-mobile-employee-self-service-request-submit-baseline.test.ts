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
  const workItem = readUtf8("work-items", "WI-0250-mobile-employee-self-service-request-submit-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const submitScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeRequestSubmitScreen.js");
  const requestLib = readUtf8("apps", "mobile", "src", "lib", "employeeRequest.js");
  const requestStore = readUtf8("apps", "mobile", "src", "lib", "employeeRequestStore.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0250/);
  assert.match(workItem, /Mobile Employee Self-Service Request Submit Baseline/);
  assert.match(navigator, /EmployeeRequestSubmitScreen/);
  assert.match(navigator, /name=\"EmployeeRequestSubmit\"/);
  assert.match(navigator, /onOpenAttendanceCorrectionRequest/);
  assert.match(navigator, /onOpenLeaveRequest/);
  assert.match(employeeScreen, /onOpenAttendanceCorrectionRequest/);
  assert.match(employeeScreen, /onOpenLeaveRequest/);
  assert.match(submitScreen, /Request Submit/);
  assert.match(submitScreen, /submitRequest/);
  assert.match(submitScreen, /Recent requests/);
  assert.match(requestLib, /validateEmployeeRequestDraft/);
  assert.match(requestLib, /createEmployeeRequestRecord/);
  assert.match(requestLib, /buildEmployeeRequestStats/);
  assert.match(requestStore, /flowhr\.mobile\.employee\.request\.v1/);
  assert.match(requestStore, /loadEmployeeRequests/);
  assert.match(requestStore, /saveEmployeeRequests/);
  assert.match(adminScreen, /WI-0258~/);
  assert.match(employeeScreen, /extensionsCardTitle|Extended Self-Service|셀프서비스 확장/);
  assert.match(readme, /Employee request submit shell/);

  assert.ok(
    countLines(navigator) <= 300,
    `RootNavigator.js should stay under 300 lines (current: ${countLines(navigator)})`
  );
  assert.ok(
    countLines(employeeScreen) <= 300,
    `EmployeeHomeScreen.js should stay under 300 lines (current: ${countLines(employeeScreen)})`
  );
  assert.ok(
    countLines(submitScreen) <= 320,
    `EmployeeRequestSubmitScreen.js should stay under 320 lines (current: ${countLines(submitScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const requestModule = await import("../../apps/mobile/src/lib/employeeRequest.js");
  const {
    buildEmployeeRequestStats,
    createEmployeeRequestRecord,
    validateEmployeeRequestDraft
  } = requestModule;

  const invalid = validateEmployeeRequestDraft({
    requestType: "leaveRequest",
    requestDate: "2026-02-22",
    leaveEndDate: "2026-02-21",
    leaveUnit: "hourly",
    leaveHours: "",
    reason: "abc"
  });
  assert.equal(invalid.valid, false);
  assert.ok(invalid.errors.length >= 2);

  const valid = validateEmployeeRequestDraft({
    requestType: "attendanceCorrection",
    requestDate: "2026-02-23",
    reason: "Forgot to checkout at kiosk",
    note: "Correct to 18:10"
  });
  assert.equal(valid.valid, true);

  const record = createEmployeeRequestRecord(valid.normalized, "employee-001", new Date("2026-02-23T10:00:00.000Z"));
  assert.equal(record.actorId, "employee-001");
  assert.equal(record.requestType, "attendanceCorrection");
  assert.equal(record.status, "submitted");

  const stats = buildEmployeeRequestStats([
    record,
    {
      ...record,
      id: "req-2",
      requestType: "leaveRequest"
    }
  ]);
  assert.equal(stats.total, 2);
  assert.equal(stats.attendanceCorrection, 1);
  assert.equal(stats.leaveRequest, 1);
}

run()
  .then(() => {
    console.log("e2e-wi0250-mobile-employee-self-service-request-submit-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
