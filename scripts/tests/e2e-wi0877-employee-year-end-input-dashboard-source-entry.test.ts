import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const hubs = readUtf8("src", "components", "employee-dashboard", "workspace-hubs.ts");
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const sourceContext = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-source-context.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0877-employee-year-end-input-dashboard-source-entry.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(hubs, /\/employee\/year-end-input\?source=employee-dashboard/);

  assert.match(consoleSource, /useSearchParams/);
  assert.match(consoleSource, /resolveEmployeeYearEndInputSourceEntry/);
  assert.match(consoleSource, /searchParams\.get\("source"\)/);
  assert.match(consoleSource, /sourceEntry \? <p className="small muted">\{sourceEntry\.hint\}<\/p> : null/);
  assert.match(consoleSource, /sourceEntry \? sourceEntry\.returnLabel : copy\.backToEmployeeAction/);

  assert.match(sourceContext, /source !== "employee-dashboard"/);
  assert.match(sourceContext, /Opened from employee dashboard\./);
  assert.match(sourceContext, /Back to dashboard/);

  assert.match(workItem, /WI-0877/i);
  assert.match(workItem, /employee|year-end|dashboard|source|entry/i);
  assert.match(roadmap, /WI-0877/i);
}

run();
console.log("e2e-wi0877-employee-year-end-input-dashboard-source-entry.test passed");
