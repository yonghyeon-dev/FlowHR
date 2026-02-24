import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const validationHelpers = readUtf8("src", "app", "employee", "page-validation-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0383-employee-validation-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(validationHelpers, /export function buildCorrectionValidation/);
  assert.match(validationHelpers, /export function buildAttendancePreSubmitChecks/);
  assert.match(validationHelpers, /export function buildLeavePreSubmitChecks/);
  assert.match(validationHelpers, /export function buildResubmitFlowChecks/);
  assert.match(validationHelpers, /export function buildIntegratedSubmitChecklistCards/);

  assert.match(employeePage, /buildCorrectionValidation\(\{/);
  assert.match(employeePage, /buildAttendancePreSubmitChecks\(\{/);
  assert.match(employeePage, /buildLeavePreSubmitChecks\(\{/);
  assert.match(employeePage, /buildResubmitFlowChecks\(\{/);
  assert.match(employeePage, /buildIntegratedSubmitChecklistCards\(\{/);

  assert.doesNotMatch(employeePage, /const checks: PreSubmitCheckItem\[\] = \[];/);

  assert.match(workItem, /WI-0383/i);
  assert.match(workItem, /validation helper extraction/i);
  assert.match(roadmap, /WI-0383/i);
}

run()
  .then(() => {
    console.log("e2e-wi0383-employee-validation-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
