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
  const noticesWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const recruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspace.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0476-admin-non-payroll-workspace-line-budget-guard.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(noticesWorkspace) <= 300, "AdminNoticeWorkspace must stay <= 300 lines");
  assert.ok(countLines(benefitsWorkspace) <= 300, "AdminBenefitsWorkspace must stay <= 300 lines");
  assert.ok(countLines(recruitmentWorkspace) <= 300, "AdminRecruitmentWorkspace must stay <= 300 lines");

  const forbiddenPresetStackPattern =
    /follow-up-recommendation-upgrade|execution-summary-digest|backlog-digest|preset import\/export/i;
  assert.doesNotMatch(noticesWorkspace, forbiddenPresetStackPattern);
  assert.doesNotMatch(benefitsWorkspace, forbiddenPresetStackPattern);
  assert.doesNotMatch(recruitmentWorkspace, forbiddenPresetStackPattern);

  assert.match(workItem, /WI-0476/i);
  assert.match(workItem, /line budget|guard|notices|benefits|recruitment/i);
  assert.match(roadmap, /WI-0476/i);
}

run()
  .then(() => {
    console.log("e2e-wi0476-admin-non-payroll-workspace-line-budget-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
