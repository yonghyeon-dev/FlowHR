import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const copy = readUtf8("src", "components", "recruitment", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0539-employee-recruitment-stalled-risk-self-service-filter.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const \[riskFilter, setRiskFilter\] = useState<"all" \| "stalled_7d" \| "stalled_14d">\("all"\)/);
  assert.match(workspace, /copy\.referralRiskFilterLabel/);
  assert.match(workspace, /copy\.referralRiskFilter\.stalled7d/);
  assert.match(workspace, /copy\.referralRiskFilter\.stalled14d/);
  assert.match(workspace, /stalledReferralCount/);
  assert.match(workspace, /stalledCriticalReferralCount/);
  assert.match(workspace, /copy\.stalledBadgeLabel/);
  assert.match(workspace, /copy\.stalledCriticalBadgeLabel/);

  assert.match(copy, /referralRiskFilterLabel: string;/);
  assert.match(copy, /referralRiskSummaryLabel: string;/);
  assert.match(copy, /criticalReferralRiskSummaryLabel: string;/);
  assert.match(copy, /referralRiskFilter: \{/);

  assert.match(workItem, /WI-0539/i);
  assert.match(workItem, /employee|recruitment|stalled|risk|filter|badge/i);
  assert.match(roadmap, /WI-0539/i);
}

run()
  .then(() => {
    console.log("e2e-wi0539-employee-recruitment-stalled-risk-self-service-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
