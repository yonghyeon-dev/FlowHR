import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminActionHelpers = readUtf8("src", "app", "admin", "page-action-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0377-admin-page-action-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /from "@\/app\/admin\/page-action-helpers";/);
  assert.match(adminPage, /await listEmployeesFromHelper\(\{/);
  assert.match(adminPage, /await createEmployeeFromHelper\(\{/);
  assert.match(adminPage, /await createInviteFromHelper\(\{/);
  assert.match(adminPage, /await listSchedulesFromHelper\(\{/);
  assert.match(adminPage, /await createScheduleFromHelper\(\{/);
  assert.match(adminPage, /await deleteScheduleFromHelper\(\{/);
  assert.match(adminPage, /await listOrganizationsFromHelper\(\{/);
  assert.match(adminPage, /await createOrganizationFromHelper\(\{/);
  assert.match(adminPage, /await loadLeavePolicyFromHelper\(\{/);
  assert.match(adminPage, /await saveLeavePolicyFromHelper\(\{/);
  assert.match(adminPage, /await listAttendanceAggregatesFromHelper\(\{/);
  assert.match(adminPage, /buildAdminValidationFailureLog\(\{/);
  assert.doesNotMatch(adminPage, /const payload = \{\s*id: employeeId\.trim\(\),/);
  assert.doesNotMatch(adminPage, /const parsed = body as \{ employees\?: EmployeeSummary\[] \};/);

  assert.match(adminActionHelpers, /export async function listEmployeesFromHelper/);
  assert.match(adminActionHelpers, /export async function createEmployeeFromHelper/);
  assert.match(adminActionHelpers, /export async function createInviteFromHelper/);
  assert.match(adminActionHelpers, /export async function listSchedulesFromHelper/);
  assert.match(adminActionHelpers, /export async function createScheduleFromHelper/);
  assert.match(adminActionHelpers, /export async function deleteScheduleFromHelper/);
  assert.match(adminActionHelpers, /export async function listOrganizationsFromHelper/);
  assert.match(adminActionHelpers, /export async function createOrganizationFromHelper/);
  assert.match(adminActionHelpers, /export async function loadLeavePolicyFromHelper/);
  assert.match(adminActionHelpers, /export async function saveLeavePolicyFromHelper/);
  assert.match(adminActionHelpers, /export async function listAttendanceAggregatesFromHelper/);
  assert.match(adminActionHelpers, /export function buildAdminValidationFailureLog/);

  assert.match(workItem, /WI-0377/i);
  assert.match(workItem, /action helper extraction/i);
  assert.match(roadmap, /WI-0377/i);
}

run()
  .then(() => {
    console.log("e2e-wi0377-admin-page-action-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
