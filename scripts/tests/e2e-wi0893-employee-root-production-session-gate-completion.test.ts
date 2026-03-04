import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeApiHelpers = readUtf8("src", "app", "employee", "page-api-helpers.ts");
  const employeeMutationRuntime = readUtf8("src", "app", "employee", "page-mutation-runtime.ts");
  const dashboardChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const accountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const attendanceLeaveForms = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceLeaveFormsPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0893-employee-root-production-session-gate-completion.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeePage,
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/
  );
  assert.match(
    employeePage,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(employeePage, /allowHeaderActorFallback,/);
  assert.match(employeePage, /requiresLoginSession,/);
  assert.match(employeePage, /productionSessionRequiredNotice,/);
  assert.match(employeePage, /requiresLoginSession=\{requiresLoginSession\}/);
  assert.match(
    employeePage,
    /productionSessionRequiredNotice=\{productionSessionRequiredNotice\}/
  );

  assert.match(employeeApiHelpers, /allowHeaderActorFallback: boolean;/);
  assert.match(employeeApiHelpers, /if \(!input\.allowHeaderActorFallback\) \{\s*return headers;\s*\}/);

  assert.match(employeeMutationRuntime, /allowHeaderActorFallback: boolean;/);
  assert.match(employeeMutationRuntime, /requiresLoginSession: boolean;/);
  assert.match(employeeMutationRuntime, /productionSessionRequiredNotice: string;/);
  assert.match(
    employeeMutationRuntime,
    /if \(requiresLoginSession\) \{\s*const body = \{\s*error: productionSessionRequiredNotice,\s*reason: "requires_login_session"/
  );
  assert.match(employeeMutationRuntime, /status: 401,/);
  assert.match(employeeMutationRuntime, /allowHeaderActorFallback,/);

  assert.match(dashboardChrome, /requiresLoginSession: boolean;/);
  assert.match(dashboardChrome, /productionSessionRequiredNotice: string;/);
  assert.match(
    dashboardChrome,
    /\{productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );

  assert.match(accountOverviewPanels, /requiresLoginSession: boolean;/);
  assert.match(accountOverviewPanels, /disabled=\{requiresLoginSession\}/);

  assert.match(attendanceLeaveForms, /disabled=\{requiresLoginSession\}/);
  assert.match(
    attendanceLeaveForms,
    /disabled=\{!lastAttendanceId \|\| requiresLoginSession\}/
  );
  assert.match(
    attendanceLeaveForms,
    /disabled=\{!correctionValidationIsValid \|\| !attendancePreSubmitValid \|\| requiresLoginSession\}/
  );
  assert.match(
    attendanceLeaveForms,
    /disabled=\{!leavePreSubmitValid \|\| requiresLoginSession\}/
  );
  assert.match(
    attendanceLeaveForms,
    /disabled=\{!lastLeaveRequestId \|\| requiresLoginSession\}/
  );

  assert.match(workItem, /WI-0893/i);
  assert.match(workItem, /employee|portal|production|session|login|devtools/i);
  assert.match(roadmap, /WI-0893/i);
}

run()
  .then(() => {
    console.log("e2e-wi0893-employee-root-production-session-gate-completion.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
