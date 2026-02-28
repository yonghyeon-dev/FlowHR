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
  const boardView = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoardView.tsx");
  const copy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0615-employee-schedule-attendance-correction-cta.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(boardView, /const attendanceCorrectionHref = `\/employee\?attendanceSource=schedule/);
  assert.match(boardView, /encodeURIComponent\(fromDate\)/);
  assert.match(boardView, /encodeURIComponent\(toDate\)/);
  assert.match(boardView, /#attendance`;/);
  assert.match(boardView, /href=\{attendanceCorrectionHref\}/);
  assert.match(boardView, /copy\.statusQuickCorrectionAction/);

  assert.match(copy, /statusQuickCorrectionAction: string;/);
  assert.match(copy, /statusQuickCorrectionAction: "출퇴근 정정 요청으로 이동"/);
  assert.match(copy, /statusQuickCorrectionAction: "Open attendance correction request"/);

  assert.ok(
    countLines(boardView) <= 290,
    `EmployeeScheduleBoardView.tsx should stay <= 290 lines (current: ${countLines(boardView)})`
  );

  assert.match(workItem, /WI-0615/i);
  assert.match(workItem, /schedule|attendance correction|cta|employee/i);
  assert.match(roadmap, /WI-0615/i);
}

run()
  .then(() => {
    console.log("e2e-wi0615-employee-schedule-attendance-correction-cta.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
