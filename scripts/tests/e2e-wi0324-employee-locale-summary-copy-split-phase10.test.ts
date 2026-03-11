import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeDashboardDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "page-dashboard-derived-state.ts"
  );
  const employeeDerivedHelpers = readUtf8("src", "app", "employee", "page-derived-helpers.ts");
  const employeeRequestHelpers = readUtf8("src", "app", "employee", "page-request-helpers.ts");
  const employeeSummarySources = `${employeePage}\n${employeeDashboardDerivedState}\n${employeeDerivedHelpers}\n${employeeRequestHelpers}`;
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0324-employee-locale-summary-copy-split-phase10.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /summaryCopy/);
  assert.match(employeePage, /leaveBalance: leaveBalanceCopy,\s*leaveUnits: leaveUnitCopy/);
  assert.match(employeePage, /leaveBalanceCopy,/);
  assert.match(employeePage, /leaveUnitCopy,/);

  assert.match(employeeDashboardDerivedState, /return leaveBalanceCopy\.notLoaded;/);
  assert.match(employeeDashboardDerivedState, /return leaveBalanceCopy\.summary\(/);

  assert.match(employeeSummarySources, /label: leaveBalanceCopy\.cardLabels\.remaining/);
  assert.match(employeeSummarySources, /leaveBalanceCopy\.projectedRemaining/);
  assert.match(employeeSummarySources, /leaveUnitCopy\.hourUnit\(request\.hours\.toFixed\(2\)\)/);
  assert.match(employeePage, /leaveBalanceLabel=\{/);
  assert.match(employeePage, /leaveBalanceCopy\.dayUnit\(formatDays\(leaveBalance\.remainingDays\)\)/);

  assert.match(employeeLocaleHelpers, /const EMPLOYEE_SUMMARY_COPY_BY_LOCALE =/);
  assert.match(employeeLocaleHelpers, /summaryCopy: EMPLOYEE_SUMMARY_COPY_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /leaveBalance: \{/);
  assert.match(employeeLocaleHelpers, /leaveUnits: \{/);

  assert.match(workItem, /WI-0324/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /summary/i);
  assert.match(roadmap, /WI-0324/i);
}

run()
  .then(() => {
    console.log("e2e-wi0324-employee-locale-summary-copy-split-phase10.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
