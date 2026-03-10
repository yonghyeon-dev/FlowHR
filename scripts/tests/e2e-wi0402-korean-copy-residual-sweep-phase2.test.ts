import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const SOURCE_PATHS = [
  "src/app/admin/approval-executions/page.tsx",
  "src/app/admin/approval-history/page-locale-helpers.ts",
  "src/app/admin/approval-policy/page-locale-helpers.ts",
  "src/app/admin/approval-templates/page-locale-helpers.ts",
  "src/app/admin/page.tsx",
  "src/app/admin/people/page-view.tsx",
  "src/app/ops/admin-console/page-client.tsx",
  "src/app/ops/mvp-console/page-client.tsx",
  "src/components/admin-approval/ApprovalQueuePanel.tsx",
  "src/components/admin-approval/ApprovalQueueSearchSortPanel.tsx",
  "src/components/admin-attendance-live/copy.ts",
  "src/components/admin-dashboard/AdminAggregateLeavePanels.tsx",
  "src/components/admin-dashboard/AdminOnboardingAccountPanels.tsx",
  "src/components/admin-dashboard/AdminPayrollPanel.tsx",
  "src/components/admin-dashboard/AdminPeopleInvitePanels.tsx",
  "src/components/admin-dashboard/AdminSchedulingPanel.tsx",
  "src/components/admin-kpi/copy.ts",
  "src/components/admin-onboarding/copy.ts",
  "src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx",
  "src/components/employee-guide/copy.ts",
  "src/components/leave-calendar/copy.ts",
  "src/components/payroll-close/copy.ts",
  "src/components/payroll-insurance/copy.ts",
  "src/components/payroll-payslip-delivery/copy.ts",
  "src/components/payroll-year-end-filing/copy.ts",
  "src/components/payroll-year-end/copy.ts",
  "src/components/payroll-year-end/employee-year-end-input-copy.ts",
  "src/components/scheduling/copy.ts"
] as const;

const LEGACY_TERMS = /내 직원 ID|직원 ID|조직 ID|액터 ID|API 로그/;

async function run() {
  for (const path of SOURCE_PATHS) {
    const source = readUtf8(path);
    assert.doesNotMatch(source, LEGACY_TERMS, `legacy term remains in ${path}`);
  }

  const approvalExecutions = readUtf8("src/app/admin/approval-executions/page.tsx");
  const peoplePageView = readUtf8("src/app/admin/people/page-view.tsx");
  const employeeAccountOverview = readUtf8(
    "src/components/employee-dashboard/EmployeeAccountOverviewPanels.tsx"
  );
  const adminPeopleInvite = readUtf8("src/components/admin-dashboard/AdminPeopleInvitePanels.tsx");

  assert.match(approvalExecutions, /조직 식별자/);
  assert.match(approvalExecutions, /관리자 액터 식별자/);
  assert.match(peoplePageView, /요청 로그/);
  assert.match(employeeAccountOverview, /내 직원 번호/);
  assert.match(adminPeopleInvite, /액터 식별자/);

  const workItem = readUtf8("work-items/WI-0402-korean-copy-residual-sweep-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");
  assert.match(workItem, /WI-0402/i);
  assert.match(roadmap, /WI-0402/i);
}

run()
  .then(() => {
    console.log("e2e-wi0402-korean-copy-residual-sweep-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

