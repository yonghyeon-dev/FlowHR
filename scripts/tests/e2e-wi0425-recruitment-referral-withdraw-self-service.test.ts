import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const recruitmentTypes = readUtf8("src", "features", "recruitment", "types.ts");
  const recruitmentSchemas = readUtf8("src", "features", "recruitment", "schemas.ts");
  const recruitmentStore = readUtf8("src", "features", "recruitment", "store.ts");
  const withdrawRoute = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "referrals",
    "[referralId]",
    "withdraw",
    "route.ts"
  );
  const employeeWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspace.tsx"
  );
  const employeeWorkspaceView = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspaceView.tsx"
  );
  const recruitmentCopy = readUtf8("src", "components", "recruitment", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0425-recruitment-referral-withdraw-self-service.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(recruitmentTypes, /"WITHDRAWN"/);
  assert.match(recruitmentSchemas, /export const withdrawRecruitmentReferralSchema = z\.object\(/);
  assert.match(recruitmentStore, /export function withdrawRecruitmentReferral\(/);
  assert.match(recruitmentStore, /target\.stage = "WITHDRAWN"/);
  assert.match(
    recruitmentStore,
    /const withdrawn = items\.filter\(\(item\) => item\.stage === "WITHDRAWN"\)\.length;/
  );

  assert.match(withdrawRoute, /recruitment\.referral\.withdraw\.unauthorized/);
  assert.match(withdrawRoute, /recruitment\.referral\.withdraw\.forbidden/);
  assert.match(withdrawRoute, /recruitment\.referral\.withdraw\.invalid_state/);
  assert.match(withdrawRoute, /withdrawRecruitmentReferral\(/);

  assert.match(employeeWorkspace, /async function withdrawReferral\(referralId: string\)/);
  assert.match(
    employeeWorkspace,
    /\/api\/recruitment\/referrals\/\$\{encodeURIComponent\(referralId\)\}\/withdraw/
  );
  assert.match(employeeWorkspaceView, /copy\.withdrawAction/);
  assert.match(employeeWorkspaceView, /copy\.referralStageFilter\.WITHDRAWN/);
  assert.match(employeeWorkspaceView, /referralSummary\.withdrawn/);

  assert.match(recruitmentCopy, /withdrawAction/);
  assert.match(recruitmentCopy, /WITHDRAWN: "泥좏쉶"/);
  assert.match(recruitmentCopy, /WITHDRAWN: "Withdrawn"/);
  assert.match(recruitmentCopy, /withdrawFailed/);

  assert.match(workItem, /WI-0425/i);
  assert.match(workItem, /recruitment|referral|withdraw|employee|self-service/i);
  assert.match(roadmap, /WI-0425/i);
}

run()
  .then(() => {
    console.log("e2e-wi0425-recruitment-referral-withdraw-self-service.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
