import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const prefillHelpers = readUtf8("src", "app", "employee", "page-query-prefill-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0616-employee-attendance-correction-prefill.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /useSearchParams/);
  assert.match(employeePage, /resolveAttendanceCorrectionSchedulePrefill/);
  assert.match(employeePage, /resolveAttendanceCorrectionTargetFromScheduleRange/);
  assert.match(employeePage, /setCheckInAt\(attendanceSchedulePrefill\.checkInAt\)/);
  assert.match(employeePage, /setCheckOutAt\(attendanceSchedulePrefill\.checkOutAt\)/);
  assert.match(employeePage, /setAttendanceNotes\(attendanceSchedulePrefill\.note\)/);
  assert.match(employeePage, /applyAttendanceRecordToCorrectionForm\(correctionTarget\)/);

  assert.match(prefillHelpers, /attendanceSource/);
  assert.match(prefillHelpers, /fromDate/);
  assert.match(prefillHelpers, /toDate/);
  assert.match(prefillHelpers, /T09:00/);
  assert.match(prefillHelpers, /T18:00/);
  assert.match(prefillHelpers, /resolveAttendanceCorrectionSchedulePrefill/);
  assert.match(prefillHelpers, /resolveAttendanceCorrectionTargetFromScheduleRange/);

  assert.match(workItem, /WI-0616/i);
  assert.match(workItem, /schedule|attendance correction|prefill|employee/i);
  assert.match(roadmap, /WI-0616/i);
}

run()
  .then(() => {
    console.log("e2e-wi0616-employee-attendance-correction-prefill.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
