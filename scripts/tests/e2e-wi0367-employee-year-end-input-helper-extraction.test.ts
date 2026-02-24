import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const helperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-year-end-input-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0367-employee-year-end-input-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /buildEmployeeYearEndSimulation/);
  assert.match(helperSource, /buildEmployeeYearEndAccuracyGuidance/);
  assert.match(helperSource, /parseNonNegativeInt/);
  assert.match(helperSource, /isNonNegativeIntegerText/);

  assert.match(consoleSource, /buildEmployeeYearEndSimulation\(/);
  assert.match(consoleSource, /buildEmployeeYearEndAccuracyGuidance\(/);
  assert.doesNotMatch(consoleSource, /function parseRate/);
  assert.doesNotMatch(consoleSource, /const deductionCaps =/);

  assert.match(workItem, /WI-0367/i);
  assert.match(workItem, /helper extraction/i);
  assert.match(roadmap, /WI-0367/i);
}

run()
  .then(() => {
    console.log("e2e-wi0367-employee-year-end-input-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
