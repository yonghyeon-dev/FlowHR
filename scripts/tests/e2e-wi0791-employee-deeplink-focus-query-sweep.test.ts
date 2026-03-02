import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const scheduleBoardView = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const employeeGuideCopy = readUtf8(
    "src",
    "components",
    "employee-guide",
    "copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0791-employee-deeplink-focus-query-sweep.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    scheduleBoardView,
    /const attendanceCorrectionHref = `\/employee\?focus=attendance&attendanceSource=schedule/,
    "schedule quick-correction link should use focus query with schedule context"
  );
  assert.doesNotMatch(
    scheduleBoardView,
    /\/employee#attendance/,
    "schedule quick-correction link should not use legacy hash anchor"
  );
  assert.match(
    scheduleBoardView,
    /href=\{attendanceCorrectionHref\}/,
    "schedule quick-correction CTA should reuse computed deep-link"
  );

  assert.match(
    employeeGuideCopy,
    /label: "Attendance", href: "\/employee\?focus=attendance"/,
    "employee guide quick action should use focus query for attendance"
  );
  assert.match(
    employeeGuideCopy,
    /label: "Leave", href: "\/employee\?focus=leave"/,
    "employee guide quick action should use focus query for leave"
  );
  assert.match(
    employeeGuideCopy,
    /label: "근태", href: "\/employee\?focus=attendance"/,
    "ko guide quick action should use focus query for attendance"
  );
  assert.match(
    employeeGuideCopy,
    /label: "휴가", href: "\/employee\?focus=leave"/,
    "ko guide quick action should use focus query for leave"
  );

  assert.match(workItem, /WI-0791/i);
  assert.match(workItem, /employee|focus|deeplink|schedule|guide|query/i);
  assert.match(roadmap, /WI-0791/i);
}

run();
console.log("e2e-wi0791-employee-deeplink-focus-query-sweep.test passed");
