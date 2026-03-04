import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0880-employee-page-line-budget-recovery.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(employeePage) <= 500,
    `employee/page.tsx should stay <= 500 lines (current: ${countLines(employeePage)})`
  );
  assert.match(employeePage, /useApplyAttendanceSchedulePrefillEffect/);
  assert.match(employeePage, /useEmployeeInteractionOrchestratorInput\(\{/);
  assert.match(employeePage, /onRefreshEmployeeSnapshot=\{\(\)\s*=>\s*void mutationActions\.refreshEmployeeSnapshot\(\)\}/);
  assert.match(employeePage, /onCreateAttendance=\{\(\)\s*=>\s*void mutationActions\.createAttendance\(\)\}/);
  assert.match(employeePage, /onCancelLeave=\{\(\)\s*=>\s*void mutationActions\.cancelLeave\(\)\}/);

  assert.match(workItem, /WI-0880/i);
  assert.match(workItem, /employee|page|line budget|recovery/i);
  assert.match(roadmap, /WI-0880/i);
}

run();
console.log("e2e-wi0880-employee-page-line-budget-recovery.test passed");
