import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const adminChrome = readUtf8("src", "components", "admin-dashboard", "AdminDashboardChrome.tsx");
  const adminDebugLogsPanel = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminDebugLogsPanel.tsx"
  );
  const adminOnboardingAccountPanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminOnboardingAccountPanels.tsx"
  );
  const adminPeopleInvitePanels = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminPeopleInvitePanels.tsx"
  );
  const adminPayrollPanel = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const employeeChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const employeeRequestFeedbackPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeRequestFeedbackPanels.tsx"
  );
  const employeeResubmitPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeResubmitPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0310-locale-dynamic-ui-residual-gap-fix-and-page-decomposition-phase3.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /직원\(employee\)|매니저\(manager\)|링크\(link\)|이메일\(email\)/);
  assert.match(
    adminPage,
    /employee: isKoLocale \? "직원" : "Employee"/
  );
  assert.match(adminPage, /const updatedAtLabel = isKoLocale \? "업데이트" : "Updated";/);

  assert.match(
    adminPayrollPanel,
    /\{isKoLocale \? "법정공제\(한국 기준\)" : "Statutory deductions \(KR baseline\)"\}/
  );

  assert.match(adminChrome, /<h1 className="page-title">\{isKoLocale \? "관리자 대시보드" : "Admin Dashboard"\}<\/h1>/);
  assert.match(adminChrome, /\{isKoLocale \? "대시보드 새로고침" : "Refresh Dashboard"\}/);
  assert.doesNotMatch(adminChrome, /운영\(production\)/);

  assert.match(adminDebugLogsPanel, /<h2>\{isKoLocale \? "디버그 로그" : "Debug Logs"\}<\/h2>/);
  assert.match(adminOnboardingAccountPanels, /\{isKoLocale \? "개발\/검증 설정" : "Dev\/Verification Settings"\}/);
  assert.match(adminPeopleInvitePanels, /\{isKoLocale \? "직원 관리" : "Employee Management"\}/);
  assert.match(adminPeopleInvitePanels, /\{isKoLocale \? "초대 링크 생성" : "Create Invite Link"\}/);

  assert.match(employeeChrome, /<h1 className="page-title">\{isKoLocale \? "직원 포털" : "Employee Portal"\}<\/h1>/);
  assert.match(employeeChrome, /\{isKoLocale \? "휴가 대기" : "Pending Leave"\}/);
  assert.doesNotMatch(employeeChrome, /운영\(production\)/);

  assert.match(
    employeeAccountOverviewPanels,
    /\{isKoLocale \? "내 데이터 새로고침" : "Refresh My Data"\}/
  );
  assert.match(
    employeeRequestFeedbackPanels,
    /aria-label=\{isKoLocale \? "요청 검색\/정렬 목록" : "Request search and sort list"\}/
  );
  assert.match(
    employeeResubmitPanel,
    /aria-label=\{isKoLocale \? "재제출 흐름 검증" : "Resubmit flow checks"\}/
  );

  assert.match(employeePage, /success: isKoLocale \? "성공" : "Success"/);
  assert.match(workItem, /WI-0310/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0310/i);
}

run()
  .then(() => {
    console.log("e2e-wi0310-locale-dynamic-ui-residual-gap-fix-and-page-decomposition-phase3.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
