import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeDashboardChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0792-employee-admin-shortcut-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeDashboardChrome,
    /showDevTools \? \(/,
    "employee chrome should gate dev shortcuts by showDevTools"
  );
  assert.match(
    employeeDashboardChrome,
    /href="\/admin"/,
    "employee chrome should still provide admin shortcut for devtools mode"
  );
  assert.match(
    employeeDashboardChrome,
    /\(개발\) 관리자|\(dev\) Admin/,
    "employee chrome admin shortcut label should be devtools-scoped"
  );
  assert.match(
    employeeDashboardChrome,
    /href="\/ops\/mvp-console"/,
    "employee chrome should keep ops shortcut under devtools mode"
  );
  assert.doesNotMatch(
    employeeDashboardChrome,
    /className="btn btn-secondary" href="\/admin">\s*\{isKoLocale \? "관리자" : "Admin"\}/,
    "employee chrome should not expose plain admin shortcut in product mode"
  );

  assert.match(workItem, /WI-0792/i);
  assert.match(workItem, /employee|admin|shortcut|devtools|product mode/i);
  assert.match(roadmap, /WI-0792/i);
}

run();
console.log("e2e-wi0792-employee-admin-shortcut-devtools-gate.test passed");
