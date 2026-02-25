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
  const scheduleHelpers = readUtf8("src", "components", "scheduling", "helpers.ts");
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
    "WI-0468-employee-schedule-csv-export-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(scheduleHelpers, /export function exportScheduleRowsCsv\(/);
  assert.match(scheduleHelpers, /employee-schedule-\$\{stamp\}\.csv/);
  assert.match(scheduleHelpers, /return false;/);
  assert.match(scheduleHelpers, /return true;/);

  assert.match(scheduleBoard, /import[\s\S]*exportScheduleRowsCsv/);
  assert.match(scheduleBoard, /function exportCsv\(\)/);
  assert.match(scheduleBoard, /copy\.statusExported/);
  assert.match(scheduleBoard, /copy\.statusNoSchedulesToExport/);
  assert.match(scheduleBoard, /onExportCsv=\{exportCsv\}/);

  assert.match(scheduleBoardView, /onExportCsv: \(\) => void;/);
  assert.match(scheduleBoardView, /onClick=\{onExportCsv\}/);
  assert.match(scheduleBoardView, /copy\.exportCsvAction/);

  assert.match(schedulingCopy, /exportCsvAction: string;/);
  assert.match(schedulingCopy, /statusExported: string;/);
  assert.match(schedulingCopy, /statusNoSchedulesToExport: string;/);
  assert.match(schedulingCopy, /exportCsvAction: "CSV \\uB0B4\\uBCF4\\uB0B4\\uAE30"/);
  assert.match(schedulingCopy, /exportCsvAction: "Export CSV"/);
  assert.match(schedulingCopy, /statusExported: "CSV export completed\."/);
  assert.match(schedulingCopy, /statusNoSchedulesToExport: "No schedules to export\."/);

  assert.ok(
    countLines(scheduleBoard) <= 270,
    `EmployeeScheduleBoard.tsx should stay <= 270 lines (current: ${countLines(scheduleBoard)})`
  );
  assert.ok(
    countLines(scheduleBoardView) <= 290,
    `EmployeeScheduleBoardView.tsx should stay <= 290 lines (current: ${countLines(scheduleBoardView)})`
  );
  assert.ok(
    countLines(scheduleHelpers) <= 280,
    `scheduling/helpers.ts should stay <= 280 lines (current: ${countLines(scheduleHelpers)})`
  );

  assert.match(workItem, /WI-0468/i);
  assert.match(workItem, /employee|schedule|csv|export|action/i);
  assert.match(roadmap, /WI-0468/i);
}

run()
  .then(() => {
    console.log("e2e-wi0468-employee-schedule-csv-export-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
