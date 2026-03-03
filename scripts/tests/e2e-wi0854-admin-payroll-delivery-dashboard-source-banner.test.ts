import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminDashboardPage = readUtf8("src", "app", "admin", "page.tsx");
  const payrollDeliveryConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const copy = readUtf8("src", "components", "payroll-payslip-delivery", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0854-admin-payroll-delivery-dashboard-source-banner.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminDashboardPage,
    /href: "\/admin\/payroll-payslip-delivery\?focus=undistributed&source=admin-dashboard"/
  );

  assert.match(payrollDeliveryConsole, /const searchParams = useSearchParams\(\)/);
  assert.match(payrollDeliveryConsole, /const source = searchParams\.get\("source"\)/);
  assert.match(payrollDeliveryConsole, /const focus = searchParams\.get\("focus"\)/);
  assert.match(payrollDeliveryConsole, /source === "admin-dashboard"/);
  assert.match(payrollDeliveryConsole, /copy\.dashboardSourceBanner/);
  assert.match(payrollDeliveryConsole, /copy\.dashboardSourceFocusLabel/);
  assert.match(payrollDeliveryConsole, /copy\.focusUndistributedLabel/);
  assert.match(payrollDeliveryConsole, /copy\.focusAllLabel/);

  assert.match(copy, /dashboardSourceBanner: "Opened from admin dashboard"/);
  assert.match(copy, /dashboardSourceBanner: "관리자 대시보드에서 이동했습니다"/);
  assert.match(copy, /focusUndistributedLabel: "Undistributed runs"/);
  assert.match(copy, /focusUndistributedLabel: "미배포 실행"/);

  assert.match(workItem, /WI-0854/i);
  assert.match(workItem, /admin|payroll|delivery|dashboard|source|banner/i);
  assert.match(roadmap, /WI-0854/i);
}

run();
console.log("e2e-wi0854-admin-payroll-delivery-dashboard-source-banner.test passed");
