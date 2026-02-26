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
  const workspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const view = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "recruitment", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0524-admin-recruitment-stalled-risk-filter-and-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `AdminRecruitmentWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /referralRiskFilter/);
  assert.match(workspace, /stalledReferralCount/);
  assert.match(workspace, /TERMINAL_REFERRAL_STAGES/);
  assert.match(workspace, /stalled_7d/);

  assert.match(view, /copy\.referralRiskFilterLabel/);
  assert.match(view, /copy\.referralRiskSummaryLabel/);
  assert.match(view, /copy\.stalledBadgeLabel/);
  assert.match(view, /copy\.referralRiskFilter\.all/);
  assert.match(view, /copy\.referralRiskFilter\.stalled7d/);

  assert.match(copy, /referralRiskFilterLabel: "정체 위험 필터"/);
  assert.match(copy, /referralRiskFilterLabel: "Stall risk filter"/);
  assert.match(copy, /referralRiskSummaryLabel: "7일 이상 정체"/);
  assert.match(copy, /referralRiskSummaryLabel: "Stalled over 7 days"/);
  assert.match(copy, /referralRiskFilter: \{/);

  assert.match(workItem, /WI-0524/i);
  assert.match(workItem, /recruitment|stalled|risk|filter|summary/i);
  assert.match(roadmap, /WI-0524/i);
}

run()
  .then(() => {
    console.log("e2e-wi0524-admin-recruitment-stalled-risk-filter-and-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

