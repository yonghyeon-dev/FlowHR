import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminOnboardingAccountPanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminOnboardingAccountPanels.tsx"
  );
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0712-strict-devtools-gate-session-query-settings.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminOnboardingAccountPanels, /\{showDevTools \? \(/);
  assert.match(employeeAccountOverviewPanels, /\{showDevTools \? \(/);
  assert.ok(!adminOnboardingAccountPanels.includes("showDevTools || !isProductionRuntime"));
  assert.ok(!employeeAccountOverviewPanels.includes("showDevTools || !isProductionRuntime"));

  assert.match(workItem, /WI-0712/i);
  assert.match(workItem, /devtools|session|query|admin|employee/i);
  assert.match(roadmap, /WI-0712/i);
}

run()
  .then(() => {
    console.log("e2e-wi0712-strict-devtools-gate-session-query-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
