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
  const scheduleExportHelpers = readUtf8(
    "src",
    "components",
    "scheduling",
    "export-helpers.ts"
  );
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
    "WI-0469-employee-schedule-ics-export-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(scheduleExportHelpers, /export function exportScheduleRowsIcs\(/);
  assert.match(scheduleExportHelpers, /BEGIN:VCALENDAR/);
  assert.match(scheduleExportHelpers, /text\/calendar;charset=utf-8;/);
  assert.match(scheduleExportHelpers, /employee-schedule-\$\{stamp\}\.ics/);

  assert.match(scheduleBoard, /import[\s\S]*exportScheduleRowsIcs/);
  assert.match(scheduleBoard, /function exportIcs\(\)/);
  assert.match(scheduleBoard, /copy\.statusIcsExported/);
  assert.match(scheduleBoard, /onExportIcs=\{exportIcs\}/);

  assert.match(scheduleBoardView, /onExportIcs: \(\) => void;/);
  assert.match(scheduleBoardView, /onClick=\{onExportIcs\}/);
  assert.match(scheduleBoardView, /copy\.exportIcsAction/);

  assert.match(schedulingCopy, /exportIcsAction: string;/);
  assert.match(schedulingCopy, /statusIcsExported: string;/);
  assert.match(schedulingCopy, /exportIcsAction: "ICS 내보내기"/);
  assert.match(schedulingCopy, /exportIcsAction: "Export ICS"/);
  assert.match(schedulingCopy, /statusIcsExported: "ICS export completed\."/);

  assert.ok(
    countLines(scheduleBoard) <= 270,
    `EmployeeScheduleBoard.tsx should stay <= 270 lines (current: ${countLines(scheduleBoard)})`
  );
  assert.ok(
    countLines(scheduleBoardView) <= 300,
    `EmployeeScheduleBoardView.tsx should stay <= 300 lines (current: ${countLines(scheduleBoardView)})`
  );
  assert.ok(
    countLines(scheduleExportHelpers) <= 220,
    `scheduling/export-helpers.ts should stay <= 220 lines (current: ${countLines(scheduleExportHelpers)})`
  );

  assert.match(workItem, /WI-0469/i);
  assert.match(workItem, /employee|schedule|ics|export|action/i);
  assert.match(roadmap, /WI-0469/i);
}

run()
  .then(() => {
    console.log("e2e-wi0469-employee-schedule-ics-export-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
