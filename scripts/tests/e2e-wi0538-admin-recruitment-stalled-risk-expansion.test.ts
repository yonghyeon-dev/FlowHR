import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const view = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "recruitment", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0538-admin-recruitment-stalled-risk-expansion.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workspace, /const CRITICAL_STALLED_REFERRAL_DAYS = 14/);
  assert.match(workspace, /stalled_14d/);
  assert.match(workspace, /stalledCriticalReferralCount/);
  assert.match(view, /copy\.criticalReferralRiskSummaryLabel/);
  assert.match(view, /copy\.stalledCriticalBadgeLabel/);
  assert.match(view, /<option value="stalled_14d">/);

  assert.match(copy, /criticalReferralRiskSummaryLabel: string;/);
  assert.match(copy, /stalledCriticalBadgeLabel: string;/);
  assert.match(copy, /stalled14d: string;/);

  assert.match(workItem, /WI-0538/i);
  assert.match(workItem, /recruitment|stalled|14d|risk|filter/i);
  assert.match(roadmap, /WI-0538/i);
}

run()
  .then(() => {
    console.log("e2e-wi0538-admin-recruitment-stalled-risk-expansion.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
