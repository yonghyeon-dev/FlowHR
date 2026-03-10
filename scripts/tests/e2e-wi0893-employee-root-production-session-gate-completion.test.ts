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
  const attendanceForm = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceFormPanel.tsx"
  );
  const leaveRequestPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeLeaveRequestPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0893-employee-root-production-session-gate-completion.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeePage,
    /const requiresLoginSession = !supabaseSessionLoading && isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(employeePage, /const blocksEmployeeApiActions = requiresLoginSession \|\| missingEmployeeIdBinding;/);
  assert.match(employeePage, /requiresLoginSession,/);
  assert.match(employeePage, /const productionSessionRequiredNotice = missingEmployeeIdBinding/);
  assert.match(employeePage, /requiresLoginSession=\{blocksEmployeeApiActions\}/);
  assert.match(
    employeePage,
    /productionSessionRequiredNotice=\{productionSessionRequiredNotice\}/
  );

  assert.match(employeeApiHelpers, /export async function performEmployeeApiCall\(/);
  assert.match(employeeApiHelpers, /apiClientFetch\(/);
  assert.match(employeeApiHelpers, /status:\s*401,/);

  assert.match(employeeMutationRuntime, /requiresLoginSession: boolean;/);
  assert.match(employeeMutationRuntime, /requiresEmployeeIdBinding: boolean;/);
  assert.match(employeeMutationRuntime, /productionSessionRequiredNotice: string;/);
  assert.match(employeeMutationRuntime, /productionEmployeeIdRequiredNotice: string;/);
  assert.match(
    employeeMutationRuntime,
    /if \(requiresLoginSession\) \{\s*const body = \{\s*error: productionSessionRequiredNotice,\s*reason: "requires_login_session"/
  );
  assert.match(employeeMutationRuntime, /status: 401,/);
  assert.match(
    employeeMutationRuntime,
    /if \(requiresEmployeeIdBinding && mutationInput\.employeeId\.trim\(\)\.length === 0\) \{\s*const body = \{\s*error: productionEmployeeIdRequiredNotice,\s*reason: "requires_employee_id_binding"/
  );

  assert.match(dashboardChrome, /requiresLoginSession: boolean;/);
  assert.match(dashboardChrome, /productionSessionRequiredNotice: string;/);
  assert.match(
    dashboardChrome,
    /\{productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );

  assert.match(accountOverviewPanels, /requiresLoginSession: boolean;/);
  assert.match(accountOverviewPanels, /disabled=\{requiresLoginSession\}/);

  assert.match(attendanceLeaveForms, /EmployeeAttendanceFormPanel/);
  assert.match(attendanceLeaveForms, /EmployeeLeaveRequestPanel/);
  assert.match(attendanceForm, /disabled=\{requiresLoginSession\}/);
  assert.match(
    attendanceForm,
    /disabled=\{!lastAttendanceId \|\| requiresLoginSession\}/
  );
  assert.match(
    attendanceForm,
    /disabled=\{!correctionValidationIsValid \|\| !attendancePreSubmitValid \|\| requiresLoginSession\}/
  );
  assert.match(
    leaveRequestPanel,
    /disabled=\{!leavePreSubmitValid \|\| requiresLoginSession\}/
  );
  assert.match(
    leaveRequestPanel,
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
