import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeGuideDashboard = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideDashboard.tsx"
  );
  const employeeGuideSections = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideSections.tsx"
  );
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0705-employee-guide-account-session-identity-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeGuideDashboard, /showDevTools=\{data\.showDevTools\}/);
  assert.match(employeeGuideSections, /showDevTools: boolean;/);
  assert.match(
    employeeGuideSections,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session employee[\s\S]*\) : null\}/
  );

  assert.match(
    employeeAccountOverviewPanels,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session employee[\s\S]*\) : null\}/
  );
  assert.ok(!employeeAccountOverviewPanels.includes("showDevTools || !isProductionRuntime"));

  assert.match(workItem, /WI-0705/i);
  assert.match(workItem, /employee|guide|account|session|identity|devtools/i);
  assert.match(roadmap, /WI-0705/i);
}

run()
  .then(() => {
    console.log("e2e-wi0705-employee-guide-account-session-identity-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
