import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const benefitsView = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");
  const recruitmentWorkspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const recruitmentView = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspaceView.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0698-employee-workspace-session-identity-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(benefitsWorkspace, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(benefitsWorkspace, /showDevTools=\{showDevTools\}/);
  assert.match(benefitsView, /showDevTools: boolean;/);
  assert.match(
    benefitsView,
    /\{showDevTools \? \([\s\S]*<p className="small muted">[\s\S]*\{copy\.organizationIdLabel\}:/
  );

  assert.match(recruitmentWorkspace, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(recruitmentWorkspace, /showDevTools=\{showDevTools\}/);
  assert.match(recruitmentView, /showDevTools: boolean;/);
  assert.match(
    recruitmentView,
    /\{showDevTools \? \([\s\S]*<p className="small muted">[\s\S]*\{copy\.organizationIdLabel\}:/
  );

  assert.match(workItem, /WI-0698/i);
  assert.match(workItem, /employee workspace|session|identity|devtools/i);
  assert.match(roadmap, /WI-0698/i);
}

run()
  .then(() => {
    console.log("e2e-wi0698-employee-workspace-session-identity-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
