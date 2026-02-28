import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const targets = [
  ["src", "app", "admin", "page.tsx"],
  ["src", "app", "employee", "page.tsx"],
  ["src", "components", "employee-dashboard", "EmployeeAccountOverviewPanels.tsx"],
  ["src", "components", "employee-guide", "EmployeeGuideSections.tsx"],
  ["src", "components", "leave-calendar", "LeaveCalendarConsole.tsx"],
  ["src", "components", "leave-accrual", "LeaveAccrualAutoGrantConsole.tsx"],
  ["src", "components", "payroll-insurance", "PayrollInsuranceSettlementConsole.tsx"],
  ["src", "components", "payroll-insurance", "PayrollInsuranceSettlementInputPanel.tsx"]
] as const;

async function run() {
  for (const parts of targets) {
    const source = readUtf8(...parts);
    const name = parts.join("/");

    assert.doesNotMatch(source, /onOrganizationIdChange/, `${name}: manual organization setter should not be exposed`);
    assert.doesNotMatch(source, /onAccessTokenChange/, `${name}: manual access-token setter should not be exposed`);
    assert.doesNotMatch(source, /Bearer access token \(override\)/, `${name}: token override input should not be shown`);
    assert.doesNotMatch(source, /Organization ID \(optional\)/, `${name}: organization-id manual input label should not be shown`);
  }

  const workItem = readUtf8("work-items", "WI-0638-session-context-regression-guard-for-core-surfaces.md");
  const roadmap = readUtf8("ROADMAP.md");
  assert.match(workItem, /WI-0638/i);
  assert.match(roadmap, /WI-0638/i);
}

run()
  .then(() => {
    console.log("e2e-wi0638-session-context-regression-guard-for-core-surfaces.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
