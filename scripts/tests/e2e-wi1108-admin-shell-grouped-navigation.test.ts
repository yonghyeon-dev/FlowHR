import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const mobileMenuSource = readUtf8("src", "components", "layout", "SaasMobileMenu.tsx");

  assert.match(
    adminLayoutSource,
    /const navSections: SaasMobileMenuSection\[] = \[/,
    "admin layout should define grouped navigation sections"
  );
  assert.match(
    adminLayoutSource,
    /navSections\.flatMap\(\(section\) => section\.links\)/,
    "admin layout should derive flat mobile links from grouped sections"
  );
  assert.match(
    adminLayoutSource,
    /navSections=\{navSections\}/,
    "admin mobile navigation should receive grouped sections"
  );
  assert.doesNotMatch(
    adminLayoutSource,
    /\/admin\/attendance-live\?focus=aggregate/,
    "admin shell should not expose aggregate focus link as a top-level route"
  );
  assert.doesNotMatch(
    adminLayoutSource,
    /\/admin\/payroll-close\?focus=all/,
    "admin shell should not expose payroll all focus link as a top-level route"
  );

  const requiredAdminRoutes = [
    "/admin",
    "/admin/approval-executions",
    "/admin/people",
    "/admin/attendance-live",
    "/admin/contracts",
    "/admin/payroll-close",
    "/admin/payroll-year-end-filing",
    "/admin/settings"
  ];

  for (const route of requiredAdminRoutes) {
    assert.equal(adminLayoutSource.includes(route), true, `admin shell should keep stable route ${route}`);
  }

  const requiredGroupKeys = [
    "admin.navGroup.controlTower",
    "admin.navGroup.peopleAndPolicy",
    "admin.navGroup.operations",
    "admin.navGroup.payrollAndFiling",
    "admin.navGroup.settingsAndReporting"
  ];

  for (const groupKey of requiredGroupKeys) {
    assert.equal(adminLayoutSource.includes(groupKey), true, `admin layout should include group key ${groupKey}`);
  }

  assert.match(
    mobileMenuSource,
    /navSections\?: SaasMobileMenuSection\[];/,
    "shared mobile menu should keep grouped-section support"
  );
}

run();
console.log("e2e-wi1108-admin-shell-grouped-navigation.test passed");
