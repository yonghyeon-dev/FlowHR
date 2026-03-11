import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminWorkspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const compensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1133-admin-payroll-dashboard-panel-route-first-card.md"
  );

  assert.match(compensationPanels, /ADMIN_COMPENSATION_PANELS_RETIRED_WI_1136/);
  assert.match(adminWorkspaceHubs, /\/admin\/payroll-close/);
  assert.match(adminWorkspaceHubs, /\/admin\/payroll-payslip-delivery/);
  assert.match(adminWorkspaceHubs, /\/admin\/payroll-year-end/);
  assert.match(adminWorkspaceHubs, /\/admin\/payroll-year-end-filing/);

  assert.match(workItem, /WI-1133/i);
  assert.match(workItem, /route-first/i);
  assert.match(progress, /WI-1132/);
}

run()
  .then(() => {
    console.log("e2e-wi1133-admin-payroll-dashboard-route-first-card.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
