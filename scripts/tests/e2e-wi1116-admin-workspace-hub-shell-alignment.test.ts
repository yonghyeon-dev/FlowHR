import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminShellNavigation = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");

  assert.match(adminPage, /buildAdminWorkspaceHubs\(locale, t\)/);
  assert.match(workspaceHubs, /ADMIN_SHELL_SECTION_DEFINITIONS\.map/);
  assert.match(workspaceHubs, /title: t\(section\.titleKey\)/);

  for (const key of [
    "controlTower",
    "peopleAndPolicy",
    "operations",
    "payrollAndFiling",
    "settingsAndReporting",
  ]) {
    const shellKeyPattern = new RegExp(`key:\\s*"${key}"`);
    const hubKeyPattern = new RegExp(`${key}:\\s*\\{`);
    assert.match(adminShellNavigation, shellKeyPattern, `admin shell navigation should keep ${key} section`);
    assert.match(workspaceHubs, hubKeyPattern, `workspace hubs should define ${key} content`);
  }

  assert.match(workspaceHubs, /href: "\/admin\/approval-executions"/);
  assert.match(workspaceHubs, /href: "\/admin\/people"/);
  assert.match(workspaceHubs, /href: "\/admin\/attendance-live"/);
  assert.match(workspaceHubs, /href: "\/admin\/payroll-close"/);
  assert.match(workspaceHubs, /href: "\/admin\/settings"/);
}

run();
console.log("e2e-wi1116-admin-workspace-hub-shell-alignment.test passed");
