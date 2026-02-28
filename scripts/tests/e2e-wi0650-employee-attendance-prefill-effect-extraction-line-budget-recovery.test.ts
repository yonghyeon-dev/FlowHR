import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(input: string) {
  return input.split(/\r?\n/).length;
}

async function run() {
  const page = readUtf8("src", "app", "employee", "page.tsx");
  const prefillHook = readUtf8("src", "app", "employee", "page-attendance-prefill-effect.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0650-employee-attendance-prefill-effect-extraction-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(page) <= 500, `employee/page.tsx line budget exceeded: ${countLines(page)} > 500`);
  assert.match(page, /useApplyAttendanceSchedulePrefillEffect/);
  assert.match(page, /attendanceSchedulePrefill[\s\S]*attendance[\s\S]*appliedAttendanceSchedulePrefillRef/);
  assert.doesNotMatch(page, /resolveAttendanceCorrectionTargetFromScheduleRange\(/);

  assert.match(prefillHook, /resolveAttendanceCorrectionTargetFromScheduleRange/);
  assert.match(prefillHook, /applyAttendanceRecordToCorrectionForm\(correctionTarget\)/);
  assert.match(prefillHook, /setAttendanceNotes\(attendanceSchedulePrefill\.note\)/);

  assert.match(workItem, /WI-0650/i);
  assert.match(workItem, /line budget|prefill|extraction|employee/i);
  assert.match(roadmap, /WI-0650/i);
}

run()
  .then(() => {
    console.log("e2e-wi0650-employee-attendance-prefill-effect-extraction-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
