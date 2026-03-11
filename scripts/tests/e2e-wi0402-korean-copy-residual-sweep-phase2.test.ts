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
  "src/components/admin-dashboard/AdminPayrollPanel.tsx",
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

const LEGACY_TERMS = [
  "직원 ID",
  "조직 ID",
  "액터 ID",
  "API 로그"
] as const;

async function run() {
  for (const path of SOURCE_PATHS) {
    const source = readUtf8(path);
    for (const legacyTerm of LEGACY_TERMS) {
      assert.ok(!source.includes(legacyTerm), `legacy term remains in ${path}: ${legacyTerm}`);
    }
  }

  const adminPeopleInvite = readUtf8("src/components/admin-dashboard/AdminPeopleInvitePanels.tsx");
  assert.match(adminPeopleInvite, /ADMIN_PEOPLE_INVITE_PANELS_RETIRED_WI_1137/);

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
