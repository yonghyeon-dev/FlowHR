import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const payrollPage = readUtf8("src", "app", "admin", "payroll", "page.tsx");
  const adminNav = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const focusCards = readUtf8("src", "app", "admin", "page-focus-cards.ts");
  const queueBadges = readUtf8("src", "app", "admin", "page-queue-badges.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1176-admin-payroll-filing-and-documents-lane-completion.md"
  );

  assert.match(adminNav, /dashboardEntryHref: "\/admin\/payroll"/);
  assert.match(adminNav, /href: "\/admin\/payroll", labelKey: "admin\.nav\.payroll"/);
  assert.match(
    workspaceHubs,
    /href: "\/admin\/payroll", label: \{ ko: "급여 레인", en: "Payroll lane" \}/
  );
  assert.match(focusCards, /href: "\/admin\/payroll"/);
  assert.match(queueBadges, /href: `\/admin\/payroll\?source=\$\{ADMIN_HUB_SOURCE\}`/);
  assert.match(adminPage, /payrollQueue: \{ href: `\/admin\/payroll\?source=\$\{ADMIN_HUB_SOURCE\}` \}/);

  assert.match(payrollPage, /title=\{isKoLocale \? "급여 레인" : "Payroll lane"\}/);
  assert.match(payrollPage, /withAdminSource\("\/admin\/payroll-close", ADMIN_PAYROLL_SOURCE\)/);
  assert.match(
    payrollPage,
    /withAdminSource\(\s*"\/admin\/payroll-payslip-delivery\/undistributed",\s*ADMIN_PAYROLL_SOURCE\s*\)/
  );
  assert.match(payrollPage, /withAdminSource\("\/admin\/payroll-year-end-filing", ADMIN_PAYROLL_SOURCE\)/);
  assert.match(payrollPage, /title=\{isKoLocale \? "지금 먼저 열기" : "Open first now"\}/);
  assert.match(
    payrollPage,
    /title=\{isKoLocale \? "급여 워크스페이스 레인" : "Payroll workspace lanes"\}/
  );
  assert.match(
    payrollPage,
    /title=\{isKoLocale \? "레인 운영 원칙" : "Lane operating principles"\}/
  );

  assert.match(globalsCss, /\.admin-payroll-lane-shell \{/);
  assert.match(globalsCss, /\.admin-payroll-lane-surface \{/);
  assert.match(globalsCss, /\.admin-payroll-rule-list \{/);
  assert.match(workItem, /WI-1176/);
  assert.match(workItem, /\/admin\/payroll/);
}

run();
console.log("e2e-wi1176-admin-payroll-filing-and-documents-lane-completion.test passed");
