import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");
  const helpers = readUtf8("src", "components", "benefits", "employee-benefits-helpers.ts");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0547-employee-benefits-pending-aging-risk-filter-and-badge.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const \[requestRiskFilter, setRequestRiskFilter\] = useState<.*>\("all"\)/);
  assert.match(workspace, /riskFilter: requestRiskFilter/);
  assert.match(workspace, /pendingAgingRiskCount/);

  assert.match(view, /copy\.requestRiskFilterLabel/);
  assert.match(view, /copy\.requestRiskFilter\.pending3d/);
  assert.match(view, /copy\.pendingAgingRiskSummaryLabel/);
  assert.match(view, /copy\.pendingAgingLabel/);
  assert.match(view, /copy\.pendingAgingRiskBadgeLabel/);

  assert.match(helpers, /export type EmployeeBenefitRequestRiskFilter = "all" \| "pending_3d"/);
  assert.match(helpers, /export function resolveBenefitRequestPendingAgingDays/);
  assert.match(helpers, /export function isBenefitRequestPendingAgingRisk/);
  assert.match(helpers, /riskFilter === "pending_3d"/);

  assert.match(copy, /requestRiskFilterLabel: string;/);
  assert.match(copy, /pendingAgingRiskSummaryLabel: string;/);
  assert.match(copy, /pendingAgingRiskBadgeLabel: string;/);
  assert.match(copy, /requestRiskFilter: \{/);

  assert.match(workItem, /WI-0547/i);
  assert.match(workItem, /benefit|pending|aging|risk|filter|badge/i);
  assert.match(roadmap, /WI-0547/i);
}

run()
  .then(() => {
    console.log("e2e-wi0547-employee-benefits-pending-aging-risk-filter-and-badge.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
