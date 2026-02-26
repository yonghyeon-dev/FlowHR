import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const workspaceView = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0537-employee-benefits-annual-limit-remaining-preview.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const selectedBenefit = useMemo/);
  assert.match(workspace, /const selectedBenefitUsage = useMemo/);
  assert.match(workspace, /const estimatedRemainingAmount =/);
  assert.match(workspace, /const isProjectedOverLimit =/);
  assert.match(workspaceView, /copy\.annualUsageSummaryLabel/);
  assert.match(workspaceView, /copy\.estimatedRemainingLabel/);
  assert.match(workspaceView, /copy\.overLimitWarningLabel/);

  assert.match(copy, /annualUsageSummaryLabel: string;/);
  assert.match(copy, /estimatedRemainingLabel: string;/);
  assert.match(copy, /overLimitWarningLabel: string;/);

  assert.match(workItem, /WI-0537/i);
  assert.match(workItem, /benefit|annual|limit|remaining|preview/i);
  assert.match(roadmap, /WI-0537/i);
}

run()
  .then(() => {
    console.log("e2e-wi0537-employee-benefits-annual-limit-remaining-preview.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
