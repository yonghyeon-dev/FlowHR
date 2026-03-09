import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeDashboardChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const adminPeopleActions = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-directory-actions.ts"
  );
  const adminNotificationsPage = readUtf8(
    "src",
    "app",
    "admin",
    "notifications",
    "page.tsx"
  );
  const employeeNotificationsPage = readUtf8(
    "src",
    "app",
    "employee",
    "notifications",
    "page.tsx"
  );
  const employeePayslipsPage = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1056-product-feedback-and-dev-remnant-cleanup.md"
  );
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.match(
    employeeDashboardChrome,
    /\{showDevTools \? \([\s\S]*<Link className="btn btn-secondary" href="\/admin">/,
    "employee dashboard admin shortcut must stay behind showDevTools"
  );
  assert.match(
    employeeDashboardChrome,
    /\{showDevTools \? \([\s\S]*<Link className="btn btn-secondary" href="\/ops\/mvp-console">/,
    "employee dashboard ops shortcut must stay behind showDevTools"
  );

  assert.match(adminPeopleActions, /window\.confirm\(/, "admin people update must request confirmation");
  assert.match(
    adminPeopleActions,
    /Save these employee profile changes now\?/,
    "admin people confirmation message must remain in place"
  );

  assert.match(adminNotificationsPage, /const \[statusMessage, setStatusMessage\] = useState<string \| null>\(null\);/);
  assert.match(adminNotificationsPage, /setStatusMessage\("읽음 처리되었습니다\."\);/);
  assert.match(adminNotificationsPage, /\{statusMessage \? \(/, "admin notifications should render success feedback");

  assert.match(employeeNotificationsPage, /const \[statusMessage, setStatusMessage\] = useState<string \| null>\(null\);/);
  assert.match(employeeNotificationsPage, /setStatusMessage\("읽음 처리되었습니다\."\);/);
  assert.match(employeeNotificationsPage, /\{statusMessage \? \(/, "employee notifications should render success feedback");

  assert.match(employeePayslipsPage, /async function copyCompareSnapshot\(\)/);
  assert.match(employeePayslipsPage, /const summary = \[/, "payslip compare copy should build a user summary");
  assert.doesNotMatch(
    employeePayslipsPage,
    /navigator\.clipboard\.writeText\(JSON\.stringify\(/,
    "payslip compare copy must not revert to raw JSON clipboard output"
  );

  assert.match(workItem, /WI-1056/i);
  assert.match(gapInventory, /26 \| Employee dashboard .* WI-1056/);
  assert.match(gapInventory, /27 \| Payslips .* WI-1056/);
  assert.match(gapInventory, /28 \| Admin people profile update .* WI-1056/);
  assert.match(gapInventory, /29 \| Notification read action .* WI-1056/);
}

run()
  .then(() => {
    console.log("e2e-wi1056-product-feedback-and-dev-remnant-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
