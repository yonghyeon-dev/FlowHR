import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const interactionActions = readUtf8("src", "app", "employee", "page-interaction-actions.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0404-employee-interaction-handler-builder-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeePage,
    /import \{\s*buildEmployeeInteractionHandlers\s*\} from "@\/app\/employee\/page-interaction-actions";/
  );
  assert.match(employeePage, /}\s*=\s*buildEmployeeInteractionHandlers\(\{/);

  assert.doesNotMatch(employeePage, /function applyLeaveQuickPreset\(/);
  assert.doesNotMatch(employeePage, /function prefillLeaveFormFromCalendarDate\(/);
  assert.doesNotMatch(employeePage, /function moveCalendarMonth\(/);
  assert.doesNotMatch(employeePage, /function resetCalendarToCurrentMonth\(/);
  assert.doesNotMatch(employeePage, /function openPendingRequestSearch\(/);
  assert.doesNotMatch(employeePage, /function applyResubmitCandidateToDraft\(/);
  assert.doesNotMatch(employeePage, /function applyAttendanceRecordToCorrectionForm\(/);

  assert.doesNotMatch(employeePage, /\bapplyLeaveQuickPresetAction\b/);
  assert.doesNotMatch(employeePage, /\bapplyRequestSearchPresetAction\b/);
  assert.doesNotMatch(employeePage, /\bapplyResubmitCandidateToDraftAction\b/);
  assert.doesNotMatch(employeePage, /\bapplyAttendanceRecordToCorrectionFormAction\b/);

  const employeePageLineCount = employeePage.split(/\r?\n/).length;
  assert.ok(
    employeePageLineCount < 1000,
    `expected employee page line count below 1000, got ${employeePageLineCount}`
  );

  assert.match(interactionActions, /export function buildEmployeeInteractionHandlers\(/);
  assert.match(interactionActions, /const openPendingRequestSearch = \(\) => \{/);
  assert.match(interactionActions, /const applyResubmitCandidateToDraft = \(candidate: ResubmitCandidate\) => \{/);
  assert.match(interactionActions, /const applyAttendanceRecordToCorrectionForm = \(record: AttendanceRecordDto\) => \{/);
  assert.match(interactionActions, /return \{[\s\S]*applyAttendanceRecordToCorrectionForm[\s\S]*\};/);

  assert.match(workItem, /WI-0404/i);
  assert.match(workItem, /interaction handler|builder|decomposition/i);
  assert.match(roadmap, /WI-0404/i);
}

run()
  .then(() => {
    console.log("e2e-wi0404-employee-interaction-handler-builder-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
