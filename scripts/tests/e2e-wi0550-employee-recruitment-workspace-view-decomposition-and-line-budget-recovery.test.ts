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
  const workspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const view = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspaceView.tsx");
  const helpers = readUtf8("src", "components", "recruitment", "employee-recruitment-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0550-employee-recruitment-workspace-view-decomposition-and-line-budget-recovery.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `EmployeeRecruitmentWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /import EmployeeRecruitmentWorkspaceView/);
  assert.match(workspace, /import \{[\s\S]*from "@\/components\/recruitment\/employee-recruitment-helpers";/);

  assert.match(view, /<main className="saas-content">/);
  assert.match(view, /copy\.referralsTitle/);
  assert.match(view, /filteredReferrals\.map\(\(referral\) => \{/);

  assert.match(helpers, /export function parseRecruitmentOpenings/);
  assert.match(helpers, /export function filterEmployeeReferrals/);

  assert.match(workItem, /WI-0550/i);
  assert.match(workItem, /recruitment|workspace|view|decomposition|line budget|recovery/i);
  assert.match(roadmap, /WI-0550/i);
}

run()
  .then(() => {
    console.log("e2e-wi0550-employee-recruitment-workspace-view-decomposition-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
