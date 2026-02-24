import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const directoryActions = readUtf8("src", "app", "admin", "page-directory-actions.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0388-admin-directory-action-orchestrator-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /from "@\/app\/admin\/page-directory-actions";/);
  assert.match(adminPage, /const directoryActions = buildAdminDirectoryActions\(\{/);
  assert.match(adminPage, /onCreateOrganization=\{\(\) => void directoryActions\.createOrganization\(\)\}/);
  assert.match(adminPage, /onListOrganizations=\{\(\) => void directoryActions\.listOrganizations\(\)\}/);
  assert.match(adminPage, /onCreateEmployee=\{\(\) => void directoryActions\.createEmployee\(\)\}/);
  assert.match(adminPage, /onCreateSchedule=\{\(\) => void directoryActions\.createSchedule\(\)\}/);
  assert.match(adminPage, /onDeleteSchedule=\{\(scheduleId\) => void directoryActions\.deleteSchedule\(scheduleId\)\}/);
  assert.doesNotMatch(adminPage, /async function listEmployees\(/);
  assert.doesNotMatch(adminPage, /async function createEmployee\(/);
  assert.doesNotMatch(adminPage, /async function createInvite\(/);
  assert.doesNotMatch(adminPage, /async function listSchedules\(/);
  assert.doesNotMatch(adminPage, /async function createSchedule\(/);
  assert.doesNotMatch(adminPage, /async function deleteSchedule\(/);
  assert.doesNotMatch(adminPage, /async function listOrganizations\(/);
  assert.doesNotMatch(adminPage, /async function createOrganization\(/);

  const adminPageLineCount = adminPage.split(/\r?\n/).length;
  assert.ok(adminPageLineCount <= 980, `admin page line budget regression: ${adminPageLineCount}`);

  assert.match(directoryActions, /export type BuildAdminDirectoryActionsInput = \{/);
  assert.match(directoryActions, /export function buildAdminDirectoryActions\(/);
  assert.match(directoryActions, /async function listEmployees\(/);
  assert.match(directoryActions, /async function createEmployee\(/);
  assert.match(directoryActions, /async function createInvite\(/);
  assert.match(directoryActions, /async function listSchedules\(/);
  assert.match(directoryActions, /async function createSchedule\(/);
  assert.match(directoryActions, /async function deleteSchedule\(/);
  assert.match(directoryActions, /async function listOrganizations\(/);
  assert.match(directoryActions, /async function createOrganization\(/);
  assert.match(directoryActions, /confirmScheduleDelete: \(scheduleId: string\) => boolean;/);

  assert.match(workItem, /WI-0388/i);
  assert.match(workItem, /action orchestrator extraction|decomposition/i);
  assert.match(roadmap, /WI-0388/i);
}

run()
  .then(() => {
    console.log("e2e-wi0388-admin-directory-action-orchestrator-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
