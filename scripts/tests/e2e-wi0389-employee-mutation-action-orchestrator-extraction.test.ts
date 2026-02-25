import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const mutationActions = readUtf8("src", "app", "employee", "page-mutation-actions.ts");
  const mutationRuntime = readUtf8("src", "app", "employee", "page-mutation-runtime.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0389-employee-mutation-action-orchestrator-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-mutation-runtime";/);
  assert.match(employeePage, /const \{ mutationActions, clearLogs \} = buildEmployeeMutationRuntime\(\{/);
  assert.match(
    employeePage,
    /onRefreshEmployeeSnapshot=\{\(\) => void mutationActions\.refreshEmployeeSnapshot\(\)\}/
  );
  assert.match(employeePage, /onCreateAttendance=\{\(\) => void mutationActions\.createAttendance\(\)\}/);
  assert.match(employeePage, /onCheckOutNow=\{\(\) => void mutationActions\.checkOutNow\(\)\}/);
  assert.match(
    employeePage,
    /onRequestAttendanceCorrection=\{\(\) => void mutationActions\.requestAttendanceCorrection\(\)\}/
  );
  assert.match(employeePage, /onCreateLeave=\{\(\) => void mutationActions\.createLeave\(\)\}/);
  assert.match(employeePage, /onCancelLeave=\{\(\) => void mutationActions\.cancelLeave\(\)\}/);

  assert.doesNotMatch(employeePage, /async function refreshEmployeeSnapshot\(/);
  assert.doesNotMatch(employeePage, /async function createAttendance\(/);
  assert.doesNotMatch(employeePage, /async function checkOutNow\(/);
  assert.doesNotMatch(employeePage, /async function requestAttendanceCorrection\(/);
  assert.doesNotMatch(employeePage, /async function createLeave\(/);
  assert.doesNotMatch(employeePage, /async function cancelLeave\(/);

  const employeePageLineCount = employeePage.split(/\r?\n/).length;
  assert.ok(employeePageLineCount <= 1200, `employee page line budget regression: ${employeePageLineCount}`);

  assert.match(mutationActions, /export type BuildEmployeeMutationActionsInput = \{/);
  assert.match(mutationActions, /export function buildEmployeeMutationActions\(/);
  assert.match(mutationActions, /async function refreshEmployeeSnapshot\(/);
  assert.match(mutationActions, /async function createAttendance\(/);
  assert.match(mutationActions, /async function checkOutNow\(/);
  assert.match(mutationActions, /async function requestAttendanceCorrection\(/);
  assert.match(mutationActions, /async function createLeave\(/);
  assert.match(mutationActions, /async function cancelLeave\(/);

  assert.match(mutationRuntime, /import \{ buildEmployeeMutationActions \} from "@\/app\/employee\/page-mutation-actions";/);
  assert.match(mutationRuntime, /export function buildEmployeeMutationRuntime\(/);
  assert.match(mutationRuntime, /const mutationActions = buildEmployeeMutationActions\(\{/);
  assert.match(mutationRuntime, /const clearLogs = \(\) => \{\s*setLogs\(\[\]\);/);

  assert.match(workItem, /WI-0389/i);
  assert.match(workItem, /action orchestrator extraction|decomposition/i);
  assert.match(roadmap, /WI-0389/i);
}

run()
  .then(() => {
    console.log("e2e-wi0389-employee-mutation-action-orchestrator-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
