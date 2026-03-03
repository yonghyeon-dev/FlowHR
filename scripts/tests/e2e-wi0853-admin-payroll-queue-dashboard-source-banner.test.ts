import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminDashboardPage = readUtf8("src", "app", "admin", "page.tsx");
  const payrollCloseConsole = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const copy = readUtf8("src", "components", "payroll-close", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0853-admin-payroll-queue-dashboard-source-banner.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminDashboardPage,
    /href: "\/admin\/payroll-close\?focus=previewed&source=admin-dashboard"/
  );
  assert.match(
    adminDashboardPage,
    /href: "\/admin\/payroll-close\?focus=undistributed&source=admin-dashboard"/
  );

  assert.match(payrollCloseConsole, /const searchParams = useSearchParams\(\)/);
  assert.match(payrollCloseConsole, /const source = searchParams\.get\("source"\)/);
  assert.match(payrollCloseConsole, /const focus = searchParams\.get\("focus"\)/);
  assert.match(payrollCloseConsole, /source === "admin-dashboard"/);
  assert.match(payrollCloseConsole, /copy\.dashboardSourceBanner/);
  assert.match(payrollCloseConsole, /copy\.dashboardSourceFocusLabel/);
  assert.match(payrollCloseConsole, /copy\.focusPreviewedLabel/);
  assert.match(payrollCloseConsole, /copy\.focusUndistributedLabel/);
  assert.match(payrollCloseConsole, /copy\.focusAllLabel/);

  assert.match(copy, /dashboardSourceBanner: "Opened from admin dashboard"/);
  assert.match(copy, /dashboardSourceBanner: "관리자 대시보드에서 이동했습니다"/);
  assert.match(copy, /focusPreviewedLabel: "Previewed runs"/);
  assert.match(copy, /focusUndistributedLabel: "Undistributed runs"/);
  assert.match(copy, /focusPreviewedLabel: "미확정 실행"/);
  assert.match(copy, /focusUndistributedLabel: "미배포 실행"/);

  assert.match(workItem, /WI-0853/i);
  assert.match(workItem, /admin|payroll|queue|dashboard|source|banner/i);
  assert.match(roadmap, /WI-0853/i);
}

run();
console.log("e2e-wi0853-admin-payroll-queue-dashboard-source-banner.test passed");
