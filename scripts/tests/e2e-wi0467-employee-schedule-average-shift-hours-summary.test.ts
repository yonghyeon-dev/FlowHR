import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const scheduleBoard = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
  const scheduleBoardView = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const schedulingCopy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0467-employee-schedule-average-shift-hours-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(scheduleBoard, /const averageMinutesPerShift =/);
  assert.match(scheduleBoard, /summaryTotalShifts === 0 \? 0 : Math\.round\(\(totalMinutes \/ summaryTotalShifts\) \* 10\) \/ 10/);
  assert.match(scheduleBoard, /averageMinutesPerShift,/);

  assert.match(scheduleBoardView, /summaryAverageShiftHours/);
  assert.match(scheduleBoardView, /formatHours\(summary\.averageMinutesPerShift\)/);

  assert.match(schedulingCopy, /summaryAverageShiftHours: string;/);
  assert.match(schedulingCopy, /summaryAverageShiftHours: "교대당 평균 근무 시간"/);
  assert.match(schedulingCopy, /summaryAverageShiftHours: "Avg hours per shift"/);

  assert.ok(
    countLines(scheduleBoard) <= 260,
    `EmployeeScheduleBoard.tsx should stay <= 260 lines (current: ${countLines(scheduleBoard)})`
  );
  assert.ok(
    countLines(scheduleBoardView) <= 290,
    `EmployeeScheduleBoardView.tsx should stay <= 290 lines (current: ${countLines(scheduleBoardView)})`
  );

  assert.match(workItem, /WI-0467/i);
  assert.match(workItem, /employee|schedule|average|shift|hours|summary/i);
  assert.match(roadmap, /WI-0467/i);
}

run()
  .then(() => {
    console.log("e2e-wi0467-employee-schedule-average-shift-hours-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
