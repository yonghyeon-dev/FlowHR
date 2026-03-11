import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const queueBadges = readUtf8("src", "app", "admin", "page-queue-badges.ts");
  const payrollRiskPanel = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminPayrollRiskKpiPanel.tsx"
  );
  const payrollClosePage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "page.tsx"
  );
  const payrollClosePreviewedPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "previewed",
    "page.tsx"
  );
  const payrollCloseConsole = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const payslipDeliveryPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-payslip-delivery",
    "page.tsx"
  );
  const payslipDeliveryUndistributedPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-payslip-delivery",
    "undistributed",
    "page.tsx"
  );
  const payslipDeliveryConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const packageJson = readUtf8("package.json");
  const workItem = readUtf8(
    "work-items",
    "WI-1128-admin-payroll-queue-route-promotion.md"
  );

  assert.match(
    queueBadges,
    /href: `\/admin\/payroll-close\/previewed\?source=\$\{ADMIN_HUB_SOURCE\}`/
  );
  assert.match(
    queueBadges,
    /href: `\/admin\/payroll-payslip-delivery\/undistributed\?source=\$\{ADMIN_HUB_SOURCE\}`/
  );
  assert.doesNotMatch(queueBadges, /\?focus=previewed/);
  assert.doesNotMatch(queueBadges, /\?focus=undistributed/);

  assert.match(payrollRiskPanel, /href: "\/admin\/payroll-close\/previewed"/);
  assert.match(
    payrollRiskPanel,
    /href: "\/admin\/payroll-payslip-delivery\/undistributed"/
  );
  assert.doesNotMatch(payrollRiskPanel, /\?focus=previewed/);
  assert.doesNotMatch(payrollRiskPanel, /\?focus=undistributed/);

  assert.match(payrollClosePage, /redirect\(/);
  assert.match(payrollClosePage, /focus === "previewed"/);
  assert.match(payrollClosePage, /"\/admin\/payroll-close\/previewed"/);
  assert.match(
    payrollClosePage,
    /"\/admin\/payroll-payslip-delivery\/undistributed"/
  );
  assert.match(payrollClosePreviewedPage, /queueMode="previewed"/);
  assert.match(payrollCloseConsole, /queueMode\?: PayrollCloseQueueMode/);
  assert.doesNotMatch(
    payrollCloseConsole,
    /const focus = searchParams\.get\("focus"\)/
  );

  assert.match(payslipDeliveryPage, /redirect\(/);
  assert.match(payslipDeliveryPage, /focus === "undistributed"/);
  assert.match(
    payslipDeliveryPage,
    /"\/admin\/payroll-payslip-delivery\/undistributed"/
  );
  assert.match(
    payslipDeliveryUndistributedPage,
    /queueMode="undistributed"/
  );
  assert.match(
    payslipDeliveryConsole,
    /queueMode\?: PayrollPayslipDeliveryQueueMode/
  );
  assert.doesNotMatch(
    payslipDeliveryConsole,
    /const focus = searchParams\.get\("focus"\)/
  );

  assert.match(
    packageJson,
    /e2e-wi1128-admin-payroll-queue-route-promotion\.test\.ts/
  );
  assert.match(workItem, /WI-1128/);
}

run();
console.log("e2e-wi1128-admin-payroll-queue-route-promotion.test passed");
