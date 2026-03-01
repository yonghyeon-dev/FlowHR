import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeYearEndInputConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const yearEndFilingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0703-year-end-filing-employee-session-identity-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeYearEndInputConsole,
    /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\);/
  );
  assert.match(
    employeeYearEndInputConsole,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session employee[\s\S]*\) : null\}/
  );

  assert.match(
    yearEndFilingConsole,
    /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\);/
  );
  assert.match(
    yearEndFilingConsole,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session actor[\s\S]*\) : null\}/
  );

  assert.match(workItem, /WI-0703/i);
  assert.match(workItem, /year-end|filing|employee|session|identity|devtools/i);
  assert.match(roadmap, /WI-0703/i);
}

run()
  .then(() => {
    console.log("e2e-wi0703-year-end-filing-employee-session-identity-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
