import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const helpers = readUtf8("src", "components", "benefits", "admin-benefits-workspace-helpers.ts");
  const workspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const adminHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0828-admin-benefits-pending-aging-risk-filter-and-dashboard-hub-deeplink.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    helpers,
    /export type AdminBenefitRequestRiskFilter = "all" \| "over_limit" \| "pending_3d";/
  );
  assert.match(helpers, /value === "over_limit" \|\| value === "pending_3d"/);

  assert.match(workspace, /useState<AdminBenefitRequestRiskFilter>\("all"\)/);
  assert.match(workspace, /requestRiskFilter === "pending_3d"/);
  assert.match(workspace, /isBenefitRequestPendingAgingRisk\(request\)/);

  assert.match(view, /option value="pending_3d"/);
  assert.match(view, /copy\.requestRiskFilter\.pending3d/);

  assert.match(copy, /requestRiskFilter: \{[\s\S]*all: string;[\s\S]*overLimit: string;[\s\S]*pending3d: string;/);
  assert.match(copy, /overLimit: "한도 초과만",\s*pending3d: "3일 이상 승인 대기"/);
  assert.match(copy, /overLimit: "Over limit only",\s*pending3d: "Pending >= 3d"/);

  assert.match(adminHubs, /\/admin\/notices\?status=PUBLISHED&risk=no-read/);
  assert.match(adminHubs, /\/admin\/benefits\?status=SUBMITTED&risk=pending_3d/);
  assert.match(adminHubs, /\/admin\/recruitment\?risk=stalled_7d/);

  assert.match(workItem, /WI-0828/i);
  assert.match(workItem, /admin|benefits|pending|aging|risk|dashboard|hub|deeplink/i);
  assert.match(roadmap, /WI-0828/i);
}

run();
console.log("e2e-wi0828-admin-benefits-pending-aging-risk-filter-and-dashboard-hub-deeplink.test passed");
