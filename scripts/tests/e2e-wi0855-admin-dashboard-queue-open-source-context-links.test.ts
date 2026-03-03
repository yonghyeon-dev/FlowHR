import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminDashboardPage = readUtf8("src", "app", "admin", "page.tsx");
  const approvalQueuePage = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const payrollCloseConsole = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const contractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0855-admin-dashboard-queue-open-source-context-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminDashboardPage, /href: "\/admin\/approval-executions\?source=admin-dashboard"/);
  assert.match(adminDashboardPage, /href: "\/admin\/payroll-close\?source=admin-dashboard"/);
  assert.match(adminDashboardPage, /href: "\/admin\/contracts\?source=admin-dashboard"/);

  assert.match(approvalQueuePage, /source === "admin-dashboard"/);
  assert.match(payrollCloseConsole, /source === "admin-dashboard"/);
  assert.match(contractsWorkspace, /analyticsSource === "admin-dashboard"/);

  assert.match(workItem, /WI-0855/i);
  assert.match(workItem, /admin|dashboard|queue|open|source|context/i);
  assert.match(roadmap, /WI-0855/i);
}

run();
console.log("e2e-wi0855-admin-dashboard-queue-open-source-context-links.test passed");
