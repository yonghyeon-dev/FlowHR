import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminNoticeWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const adminNoticeView = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const employeeNoticeBoard = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");

  const adminBenefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const adminBenefitsView = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const employeeBenefitsWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const employeeBenefitsView = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");

  const adminRecruitmentWorkspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const adminRecruitmentView = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspaceView.tsx");
  const employeeRecruitmentWorkspace = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
  const employeeRecruitmentView = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspaceView.tsx");

  const workItem = readUtf8(
    "work-items",
    "WI-0620-notice-benefits-recruitment-session-context-productization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminNoticeWorkspace, /useStickyStringState/);
  assert.doesNotMatch(adminNoticeWorkspace, /const \[accessToken/);
  assert.match(adminNoticeWorkspace, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(adminNoticeWorkspace, /showDevTools={showDevTools}/);

  assert.doesNotMatch(adminNoticeView, /copy\.accessTokenLabel/);
  assert.doesNotMatch(adminNoticeView, /onAccessTokenChange/);
  assert.match(adminNoticeView, /sessionOrganizationId/);
  assert.match(adminNoticeView, /\{showDevTools \? \(/);

  assert.doesNotMatch(employeeNoticeBoard, /useStickyStringState/);
  assert.doesNotMatch(employeeNoticeBoard, /const \[accessToken/);
  assert.doesNotMatch(employeeNoticeBoard, /copy\.accessTokenLabel/);
  assert.match(employeeNoticeBoard, /const organizationId = \(supabaseSession\?\.organizationId/);

  assert.doesNotMatch(adminBenefitsWorkspace, /useStickyStringState/);
  assert.doesNotMatch(adminBenefitsWorkspace, /const \[accessToken/);
  assert.match(adminBenefitsWorkspace, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(adminBenefitsWorkspace, /showDevTools={showDevTools}/);

  assert.doesNotMatch(adminBenefitsView, /copy\.accessTokenLabel/);
  assert.doesNotMatch(adminBenefitsView, /onAccessTokenChange/);
  assert.match(adminBenefitsView, /sessionOrganizationId/);
  assert.match(adminBenefitsView, /\{showDevTools \? \(/);

  assert.doesNotMatch(employeeBenefitsWorkspace, /useStickyStringState/);
  assert.doesNotMatch(employeeBenefitsWorkspace, /const \[accessToken/);
  assert.match(employeeBenefitsWorkspace, /const organizationId = \(supabaseSession\?\.organizationId/);

  assert.doesNotMatch(employeeBenefitsView, /copy\.accessTokenLabel/);
  assert.doesNotMatch(employeeBenefitsView, /onAccessTokenChange/);
  assert.match(employeeBenefitsView, /sessionOrganizationId/);

  assert.doesNotMatch(adminRecruitmentWorkspace, /useStickyStringState/);
  assert.doesNotMatch(adminRecruitmentWorkspace, /const \[accessToken/);
  assert.match(adminRecruitmentWorkspace, /const organizationId = \(supabaseSession\?\.organizationId/);

  assert.doesNotMatch(adminRecruitmentView, /copy\.accessTokenLabel/);
  assert.doesNotMatch(adminRecruitmentView, /onAccessTokenChange/);
  assert.match(adminRecruitmentView, /sessionOrganizationId/);

  assert.doesNotMatch(employeeRecruitmentWorkspace, /useStickyStringState/);
  assert.doesNotMatch(employeeRecruitmentWorkspace, /const \[accessToken/);
  assert.match(employeeRecruitmentWorkspace, /const organizationId = \(supabaseSession\?\.organizationId/);

  assert.doesNotMatch(employeeRecruitmentView, /copy\.accessTokenLabel/);
  assert.doesNotMatch(employeeRecruitmentView, /onAccessTokenChange/);
  assert.match(employeeRecruitmentView, /sessionOrganizationId/);

  assert.match(workItem, /WI-0620/i);
  assert.match(workItem, /notices|benefits|recruitment|session|devtools/i);
  assert.match(roadmap, /WI-0620/i);
}

run()
  .then(() => {
    console.log("e2e-wi0620-notice-benefits-recruitment-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
