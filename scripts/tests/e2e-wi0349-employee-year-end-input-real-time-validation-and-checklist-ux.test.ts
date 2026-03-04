import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEndInputConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const yearEndInputCopy = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-year-end-input-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0349-employee-year-end-input-real-time-validation-and-checklist-ux.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(yearEndInputConsole, /isNonNegativeIntegerText/);
  assert.match(yearEndInputConsole, /const validationChecks = useMemo/);
  assert.match(yearEndInputCopy, /Real-time Input Validation/);
  assert.match(yearEndInputConsole, /pre-submit-check-list/);
  assert.match(
    yearEndInputConsole,
    /disabled=\{pendingLabel !== null \|\| !coreLoadValid(?: \|\| requiresLoginSession)?\}/
  );
  assert.match(yearEndInputCopy, /Tax rates in 0~1 range/);

  assert.match(workItem, /WI-0349/i);
  assert.match(workItem, /validation/i);
  assert.match(roadmap, /WI-0349/i);
}

run()
  .then(() => {
    console.log("e2e-wi0349-employee-year-end-input-real-time-validation-and-checklist-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
