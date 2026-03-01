import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeGuideSections = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideSections.tsx"
  );
  const employeeGuideDashboard = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideDashboard.tsx"
  );
  const employeeNoticeBoard = readUtf8(
    "src",
    "components",
    "notices",
    "EmployeeNoticeBoard.tsx"
  );
  const employeeBenefitsWorkspace = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspace.tsx"
  );
  const employeeBenefitsView = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspaceView.tsx"
  );
  const employeeRecruitmentWorkspace = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspace.tsx"
  );
  const employeeRecruitmentView = readUtf8(
    "src",
    "components",
    "recruitment",
    "EmployeeRecruitmentWorkspaceView.tsx"
  );
  const employeeScheduleView = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0710-employee-session-context-devtools-gate-core-workspaces.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeGuideSections, /showDevTools: boolean;/);
  assert.match(employeeGuideSections, /showDevTools \? \(/);
  assert.match(employeeGuideDashboard, /showDevTools=\{data\.showDevTools\}/);

  assert.match(employeeNoticeBoard, /const showDevTools = isTruthyFlag/);
  assert.match(employeeNoticeBoard, /showDevTools \? \(/);

  assert.match(employeeBenefitsWorkspace, /const showDevTools = isTruthyFlag/);
  assert.match(employeeBenefitsWorkspace, /showDevTools=\{showDevTools\}/);
  assert.match(employeeBenefitsView, /showDevTools: boolean;/);
  assert.match(employeeBenefitsView, /showDevTools \? \(/);

  assert.match(employeeRecruitmentWorkspace, /const showDevTools = isTruthyFlag/);
  assert.match(employeeRecruitmentWorkspace, /showDevTools=\{showDevTools\}/);
  assert.match(employeeRecruitmentView, /showDevTools: boolean;/);
  assert.match(employeeRecruitmentView, /showDevTools \? \(/);

  assert.match(employeeScheduleView, /showDevTools \? \(/);

  assert.match(workItem, /WI-0710/i);
  assert.match(workItem, /employee|session context|devtools|notice|benefits|recruitment|schedule|guide/i);
  assert.match(roadmap, /WI-0710/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0710-employee-session-context-devtools-gate-core-workspaces.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
