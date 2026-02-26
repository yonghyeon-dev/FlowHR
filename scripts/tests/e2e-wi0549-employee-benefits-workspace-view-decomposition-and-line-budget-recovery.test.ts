import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const workspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");
  const helpers = readUtf8("src", "components", "benefits", "employee-benefits-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0549-employee-benefits-workspace-view-decomposition-and-line-budget-recovery.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `EmployeeBenefitsWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /import EmployeeBenefitsWorkspaceView/);
  assert.match(workspace, /import \{[\s\S]*from "@\/components\/benefits\/employee-benefits-helpers";/);

  assert.match(view, /<main className="saas-content">/);
  assert.match(view, /copy\.requestTitle/);
  assert.match(view, /filteredRequests\.map\(\(item\) => \{/);

  assert.match(helpers, /export function parseBenefitCatalog/);
  assert.match(helpers, /export function filterBenefitRequests/);

  assert.match(workItem, /WI-0549/i);
  assert.match(workItem, /benefits|workspace|view|decomposition|line budget|recovery/i);
  assert.match(roadmap, /WI-0549/i);
}

run()
  .then(() => {
    console.log("e2e-wi0549-employee-benefits-workspace-view-decomposition-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
