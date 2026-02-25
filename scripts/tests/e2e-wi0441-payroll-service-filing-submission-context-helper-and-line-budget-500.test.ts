import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const workItem = readUtf8("work-items", "WI-0441-payroll-service-filing-submission-context-helper-and-line-budget-500.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /async function loadFilingSubmissionContext\(/);
  assert.match(payrollService, /const submissions = await loadFilingSubmissionContext\(context, input\.year, input\.employeeId\);/);
  assert.match(payrollService, /createYearEndFilingSubmissionFromHelper\(/);
  assert.match(payrollService, /ensureNoPendingFilingSubmission\(submissions\);/);
  assert.ok(
    countLines(payrollService) <= 500,
    `payroll service should stay <= 500 lines after WI-0441 (current: ${countLines(payrollService)})`
  );

  assert.match(workItem, /WI-0441/i);
  assert.match(workItem, /payroll|filing|context|helper|line budget/i);
  assert.match(roadmap, /WI-0441/i);
}

run()
  .then(() => {
    console.log("e2e-wi0441-payroll-service-filing-submission-context-helper-and-line-budget-500.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
