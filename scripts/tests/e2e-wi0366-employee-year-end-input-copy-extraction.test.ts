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
  const copySource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-year-end-input-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0366-employee-year-end-input-copy-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copySource, /export type EmployeeYearEndInputCopy/);
  assert.match(copySource, /export const employeeYearEndInputCopyByLocale/);
  assert.match(copySource, /accuracyGuideTitle/);

  assert.match(consoleSource, /employeeYearEndInputCopyByLocale/);
  assert.doesNotMatch(consoleSource, /const employeeYearEndInputCopyByLocale: Record/);

  assert.match(workItem, /WI-0366/i);
  assert.match(workItem, /copy extraction/i);
  assert.match(roadmap, /WI-0366/i);
}

run()
  .then(() => {
    console.log("e2e-wi0366-employee-year-end-input-copy-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
