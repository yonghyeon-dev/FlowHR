import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const mobileMenu = readUtf8("src", "components", "layout", "SaasMobileMenu.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");

  assert.match(employeeLayout, /const navSections: SaasMobileMenuSection\[] = \[/);
  assert.equal(
    employeeLayout.includes("/employee?focus="),
    false,
    "employee layout should not expose focus query links in the top-level shell"
  );

  for (const key of [
    "employee.navGroup.today",
    "employee.navGroup.requests",
    "employee.navGroup.documents",
    "employee.navGroup.noticesAndAlerts",
    "employee.navGroup.account"
  ]) {
    assert.match(messages, new RegExp(`"${key}"`), `messages should include ${key}`);
  }

  for (const route of [
    "/employee",
    "/employee/guide",
    "/employee/onboarding",
    "/employee/schedule",
    "/employee/benefits",
    "/employee/contracts",
    "/employee/payslips",
    "/employee/notifications",
    "/employee/profile",
    "/employee/settings"
  ]) {
    assert.equal(
      employeeLayout.includes(route),
      true,
      `employee layout should keep grouped navigation route ${route}`
    );
  }

  assert.match(mobileMenu, /navSections\?: SaasMobileMenuSection\[]/);
  assert.match(mobileMenu, /const sections = navSections \?\? \[\{ title: "", links: navLinks \}\];/);
}

run();
console.log("e2e-wi1107-employee-shell-grouped-navigation.test passed");
