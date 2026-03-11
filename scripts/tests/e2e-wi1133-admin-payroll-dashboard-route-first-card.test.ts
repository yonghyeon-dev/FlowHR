import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const compensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const payrollCard = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminPayrollWorkspaceCard.tsx"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1133-admin-payroll-dashboard-panel-route-first-card.md"
  );

  assert.match(
    compensationPanels,
    /from "@\/components\/admin-dashboard\/AdminPayrollWorkspaceCard";/
  );
  assert.match(compensationPanels, /<AdminPayrollWorkspaceCard/);
  assert.doesNotMatch(compensationPanels, /<AdminPayrollPanel/);

  assert.match(payrollCard, /id="payroll-workspace-card"/);
  assert.match(payrollCard, /\/admin\/payroll-close\?source=admin-dashboard/);
  assert.match(payrollCard, /\/admin\/payroll-close\/preview-builder\?source=admin-dashboard/);
  assert.match(payrollCard, /\/admin\/payroll-close\/previewed\?source=admin-dashboard/);

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
