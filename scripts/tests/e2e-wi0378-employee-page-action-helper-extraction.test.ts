import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeActionHelpers = readUtf8("src", "app", "employee", "page-action-helpers.ts");
  const employeeMutationActions = readUtf8("src", "app", "employee", "page-mutation-actions.ts");
  const workItem = readUtf8("work-items", "WI-0378-employee-page-action-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-mutation-actions";/);
  assert.match(employeePage, /const mutationActions = buildEmployeeMutationActions\(\{/);
  assert.doesNotMatch(employeePage, /const nowIso = new Date\(\)\.toISOString\(\);/);
  assert.doesNotMatch(employeePage, /const parsed = body as \{ record\?: \{ id\?: string \} \};/);

  assert.match(employeeActionHelpers, /export async function refreshEmployeeSnapshotFromHelper/);
  assert.match(employeeActionHelpers, /export async function createAttendanceFromHelper/);
  assert.match(employeeActionHelpers, /export async function checkOutNowFromHelper/);
  assert.match(employeeActionHelpers, /export async function requestAttendanceCorrectionFromHelper/);
  assert.match(employeeActionHelpers, /export async function createLeaveFromHelper/);
  assert.match(employeeActionHelpers, /export async function cancelLeaveFromHelper/);
  assert.match(employeeMutationActions, /await refreshEmployeeSnapshotFromHelper\(\{/);
  assert.match(employeeMutationActions, /await createAttendanceFromHelper\(\{/);
  assert.match(employeeMutationActions, /await checkOutNowFromHelper\(\{/);
  assert.match(employeeMutationActions, /await requestAttendanceCorrectionFromHelper\(\{/);
  assert.match(employeeMutationActions, /await createLeaveFromHelper\(\{/);
  assert.match(employeeMutationActions, /await cancelLeaveFromHelper\(\{/);

  assert.match(workItem, /WI-0378/i);
  assert.match(workItem, /action helper extraction/i);
  assert.match(roadmap, /WI-0378/i);
}

run()
  .then(() => {
    console.log("e2e-wi0378-employee-page-action-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
