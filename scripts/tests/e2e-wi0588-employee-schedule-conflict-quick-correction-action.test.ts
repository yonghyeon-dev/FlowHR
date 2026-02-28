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
  const board = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
  const boardView = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoardView.tsx");
  const copy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0588-employee-schedule-conflict-quick-correction-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copy, /statusQuickCorrectionAction: string;/);
  assert.match(copy, /statusQuickCorrectionAction:\s*"[^"]+"/);
  assert.match(copy, /statusQuickCorrectionAction: "Open attendance correction request"/);

  assert.match(boardView, /statusMessage\.includes\(copy\.statusConflictCandidatesLabel\)/);
  assert.match(boardView, /statusMessage\.includes\(`\$\{copy\.statusConflictCandidatesLabel\}: 0`\)/);
  assert.match(boardView, /const attendanceCorrectionHref = `\/employee\?attendanceSource=schedule/);
  assert.match(boardView, /#attendance`;/);
  assert.match(boardView, /href=\{attendanceCorrectionHref\}/);
  assert.match(boardView, /copy\.statusQuickCorrectionAction/);

  assert.ok(
    countLines(board) <= 260,
    `EmployeeScheduleBoard.tsx should stay <= 260 lines (current: ${countLines(board)})`
  );
  assert.ok(
    countLines(boardView) <= 290,
    `EmployeeScheduleBoardView.tsx should stay <= 290 lines (current: ${countLines(boardView)})`
  );

  assert.match(workItem, /WI-0588/i);
  assert.match(workItem, /schedule|conflict|quick correction|attendance/i);
  assert.match(roadmap, /WI-0588/i);
}

run()
  .then(() => {
    console.log("e2e-wi0588-employee-schedule-conflict-quick-correction-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
