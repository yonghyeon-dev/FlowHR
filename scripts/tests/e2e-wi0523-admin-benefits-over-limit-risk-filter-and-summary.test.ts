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
  const workspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0523-admin-benefits-over-limit-risk-filter-and-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `AdminBenefitsWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );

  assert.match(workspace, /requestRiskFilter/);
  assert.match(workspace, /setRequestRiskFilter/);
  assert.match(workspace, /overLimitRequestCount/);
  assert.match(workspace, /request\.amountKrw > annualLimitKrw/);

  assert.match(view, /copy\.requestRiskFilterLabel/);
  assert.match(view, /copy\.requestRiskFilter\.all/);
  assert.match(view, /copy\.requestRiskFilter\.overLimit/);
  assert.match(view, /copy\.overLimitRequestSummaryLabel/);
  assert.match(view, /copy\.overLimitBadgeLabel/);
  assert.match(view, /copy\.overLimitAmountLabel/);

  assert.match(copy, /requestRiskFilterLabel: "한도 위험 필터"/);
  assert.match(copy, /requestRiskFilterLabel: "Limit risk filter"/);
  assert.match(copy, /overLimitRequestSummaryLabel: "한도 초과 요청"/);
  assert.match(copy, /overLimitRequestSummaryLabel: "Over-limit requests"/);
  assert.match(copy, /requestRiskFilter: \{/);

  assert.match(workItem, /WI-0523/i);
  assert.match(workItem, /benefits|over-limit|risk|filter|summary/i);
  assert.match(roadmap, /WI-0523/i);
}

run()
  .then(() => {
    console.log("e2e-wi0523-admin-benefits-over-limit-risk-filter-and-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

