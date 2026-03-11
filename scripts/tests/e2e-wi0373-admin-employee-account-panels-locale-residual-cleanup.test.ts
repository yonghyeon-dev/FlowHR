import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminOnboardingAccountPanels.tsx"
  );
  const employeePanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0373-admin-employee-account-panels-locale-residual-cleanup.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPanels, /ADMIN_ONBOARDING_ACCOUNT_PANELS_RETIRED_WI_1137/);
  assert.ok(employeePanels.includes("Session error"));
  assert.ok(employeePanels.includes('placeholder={isKoLocale ? "예: ORG-00001" : "e.g. ORG-00001"}'));
  assert.ok(!employeePanels.includes("Session error: {supabaseSessionError}"));

  assert.match(workItem, /WI-0373/i);
  assert.match(workItem, /locale residual cleanup/i);
  assert.match(roadmap, /WI-0373/i);
}

run()
  .then(() => {
    console.log("e2e-wi0373-admin-employee-account-panels-locale-residual-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
