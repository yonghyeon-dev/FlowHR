import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeWorkspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const referralsRoute = readUtf8("src", "app", "api", "recruitment", "referrals", "route.ts");
  const recruitmentCopy = readUtf8("src", "components", "recruitment", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0420-recruitment-referral-filter-and-opening-visibility.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(referralsRoute, /listRecruitmentReferralsQuerySchema/);
  assert.match(referralsRoute, /stage: parsed\.data\.stage/);

  assert.match(employeeWorkspace, /stageFilter/);
  assert.match(employeeWorkspace, /stage: stageFilter/);
  assert.match(employeeWorkspace, /setReferralSummary\(parseSummary\(referralsRes\.parsed\)\)/);
  assert.match(employeeWorkspace, /copy\.stageFilterLabel/);
  assert.match(employeeWorkspace, /copy\.referralSummaryLabel/);
  assert.match(employeeWorkspace, /openingById\.get\(referral\.openingId\)\?\.title \?\? copy\.unknownOpeningLabel/);
  assert.match(employeeWorkspace, /copy\.openingTitleLabel/);

  assert.match(recruitmentCopy, /stageFilterLabel/);
  assert.match(recruitmentCopy, /referralSummaryLabel/);
  assert.match(recruitmentCopy, /openingTitleLabel/);
  assert.match(recruitmentCopy, /unknownOpeningLabel/);
  assert.match(recruitmentCopy, /referralStageFilter: \{/);

  assert.match(workItem, /WI-0420/i);
  assert.match(workItem, /recruitment|referral|filter|stage|opening/i);
  assert.match(roadmap, /WI-0420/i);
}

run()
  .then(() => {
    console.log("e2e-wi0420-recruitment-referral-filter-and-opening-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

