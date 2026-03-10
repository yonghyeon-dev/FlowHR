import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const navigationSource = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const focusCards = readUtf8("src", "app", "admin", "page-focus-cards.ts");

  assert.match(
    navigationSource,
    /export const ADMIN_SHELL_SECTION_DEFINITIONS/,
    "admin shell should keep a shared section definition source"
  );
  assert.match(
    navigationSource,
    /dashboardEntryHref: "\/admin\/approval-executions"/,
    "control tower dashboard entry should land on the approval workspace"
  );
  assert.match(
    adminLayout,
    /buildAdminShellNavSections\(t\)/,
    "admin layout should derive shell navigation from the shared source"
  );
  assert.match(
    adminPage,
    /buildAdminDashboardEntryLinks\(t\)/,
    "admin dashboard should derive quick-entry links from the shared shell source"
  );
  assert.match(
    adminPage,
    /dashboardEntryLinks\.map/,
    "admin dashboard should render grouped quick entries from the shared source"
  );
  assert.match(
    focusCards,
    /href: "\/admin\/payroll-close"/,
    "payroll focus card should route to the primary payroll workspace entry"
  );
}

run();
console.log("e2e-wi1109-admin-control-tower-entry-alignment.test passed");
