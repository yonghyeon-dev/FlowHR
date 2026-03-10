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
  const adminOnboardingAccountPanels = readUtf8("src", "components", "admin-dashboard", "AdminOnboardingAccountPanels.tsx");
  const adminPeopleInvitePanels = readUtf8("src", "components", "admin-dashboard", "AdminPeopleInvitePanels.tsx");
  const adminPayrollPanel = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const employeeAccountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const employeeResubmitPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeResubmitPanel.tsx");
  const employeeAttendanceLeavePanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceLeavePanels.tsx"
  );
  const employeeAttendanceLeaveFormsPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceLeaveFormsPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0303-admin-employee-locale-dynamic-ui-gap-fix-phase3.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminChrome, /\{isKoLocale \? "현재 환경은 " : "Current environment is "\}/);
  assert.match(adminChrome, /<p>\{isKoLocale \? "API 호출" : "API calls"\}<\/p>/);
  assert.match(adminOnboardingAccountPanels, /\{isKoLocale \? "현재 선택 조직" : "Current organization"\}/);
  assert.match(adminOnboardingAccountPanels, /\{isKoLocale \? "작업 조직" : "Working organization"\}/);
  assert.match(
    adminOnboardingAccountPanels,
    /\{isKoLocale \? "Bearer 액세스 토큰\(수정용\)" : "Bearer access token \(override\)"\}/
  );
  assert.match(adminPeopleInvitePanels, /\{isKoLocale \? "직원 번호 \(선택\)" : "Employee number \(optional\)"\}/);
  assert.match(
    adminPayrollPanel,
    /\{isKoLocale \? "법정공제\(한국 기준\)" : "Statutory deductions \(KR baseline\)"\}/
  );
  assert.doesNotMatch(adminPage, /Organization ID가 필요합니다\./);

  assert.match(employeeResubmitPanel, /aria-label=\{isKoLocale \? "재제출 후보 목록" : "resubmit candidate list"\}/);
  assert.match(
    employeeAccountOverviewPanels,
    /formatWorkspaceConnectionState\(Boolean\(organizationId\.trim\(\)\), isKoLocale \? "ko" : "en"\)/
  );
  assert.match(
    employeeAccountOverviewPanels,
    /formatEmployeeSessionConnectionState\(Boolean\(employeeId\.trim\(\)\), isKoLocale \? "ko" : "en"\)/
  );
  assert.match(
    employeeAttendanceLeaveFormsPanel,
    /<option value="ANNUAL">\{toLeaveTypeLabel\("ANNUAL"\)\}<\/option>/
  );
  assert.match(employeeAttendanceLeavePanels, /<h2>\{sectionTitles\.apiLogs\}<\/h2>/);
  assert.doesNotMatch(employeePage, /\?\?\? \?\? \?\?\?/);

  assert.match(workItem, /WI-0303/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /broken mojibake string|깨진 문자열/i);
  assert.match(roadmap, /WI-0303/i);
}

run()
  .then(() => {
    console.log("e2e-wi0303-admin-employee-locale-dynamic-ui-gap-fix-phase3.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
