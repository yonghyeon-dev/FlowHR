import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const view = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0536-admin-benefits-pending-aging-risk-summary.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(view, /const PENDING_AGING_THRESHOLD_DAYS = 3/);
  assert.match(view, /function isPendingAgingRisk/);
  assert.match(view, /pendingAgingRiskCount/);
  assert.match(view, /copy\.pendingAgingRiskSummaryLabel/);
  assert.match(view, /copy\.pendingAgingRiskBadgeLabel/);

  assert.match(copy, /pendingAgingRiskSummaryLabel: string;/);
  assert.match(copy, /pendingAgingRiskBadgeLabel: string;/);
  assert.match(copy, /pendingAgingRiskSummaryLabel: "[^"]+"/);
  assert.match(copy, /pendingAgingRiskBadgeLabel: "[^"]+"/);

  assert.match(workItem, /WI-0536/i);
  assert.match(workItem, /benefit|pending|aging|risk|summary/i);
  assert.match(roadmap, /WI-0536/i);
}

run()
  .then(() => {
    console.log("e2e-wi0536-admin-benefits-pending-aging-risk-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
