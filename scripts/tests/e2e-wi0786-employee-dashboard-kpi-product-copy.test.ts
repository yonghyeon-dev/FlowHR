import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeChrome = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeDashboardChrome.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0786-employee-dashboard-kpi-product-copy.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeChrome,
    /요청 처리 성공률|Request success rate/,
    "employee dashboard KPI should use request-success product copy"
  );
  assert.match(
    employeeChrome,
    /최근 처리 작업|Latest activity/,
    "employee dashboard KPI should use latest activity product copy"
  );
  assert.doesNotMatch(
    employeeChrome,
    /API success rate/,
    "employee dashboard should not expose API success rate copy"
  );
  assert.doesNotMatch(
    employeeChrome,
    /Latest Call/,
    "employee dashboard should not expose latest call copy"
  );

  assert.match(workItem, /WI-0786/i);
  assert.match(workItem, /employee/i);
  assert.match(workItem, /kpi|copy|product/i);
  assert.match(roadmap, /WI-0786/i);
}

run();
console.log("e2e-wi0786-employee-dashboard-kpi-product-copy.test passed");
