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
    "WI-0498-admin-recruitment-referral-filter-search-and-opening-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `AdminRecruitmentWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /referralFilter/);
  assert.match(workspace, /referralSearchQuery/);
  assert.match(workspace, /filteredReferrals/);
  assert.match(workspace, /openingTitleById/);
  assert.match(workspace, /haystack\.includes\(query\)/);

  assert.match(view, /copy\.referralFilterLabel/);
  assert.match(view, /copy\.referralSearchLabel/);
  assert.match(view, /copy\.filteredReferralSummaryLabel/);
  assert.match(view, /copy\.referralOpeningTitleLabel/);
  assert.match(view, /copy\.unknownOpeningLabel/);
  assert.match(view, /copy\.filteredEmptyReferrals/);

  assert.match(copy, /referralFilterLabel/);
  assert.match(copy, /referralSearchLabel/);
  assert.match(copy, /filteredReferralSummaryLabel/);
  assert.match(copy, /referralOpeningTitleLabel/);
  assert.match(copy, /unknownOpeningLabel/);
  assert.match(copy, /referralStageFilter: \{/);

  assert.match(workItem, /WI-0498/i);
  assert.match(workItem, /recruitment|referral|filter|search|opening/i);
  assert.match(roadmap, /WI-0498/i);
}

run()
  .then(() => {
    console.log("e2e-wi0498-admin-recruitment-referral-filter-search-and-opening-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
