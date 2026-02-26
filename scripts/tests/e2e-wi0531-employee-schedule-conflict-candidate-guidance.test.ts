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
  const helpers = readUtf8("src", "components", "scheduling", "helpers.ts");
  const copy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0531-employee-schedule-conflict-candidate-guidance.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export function countScheduleOverlapCandidates\(/);
  assert.match(helpers, /let overlapCount = 0;/);
  assert.match(helpers, /overlapCount \+= 1;/);

  assert.match(copy, /statusConflictCandidatesLabel: string;/);
  assert.match(copy, /statusRequestTrackingHint: string;/);
  assert.match(copy, /statusConflictCandidatesLabel: "충돌 후보"/);
  assert.match(copy, /statusConflictCandidatesLabel: "Conflict candidates"/);

  assert.match(board, /countScheduleOverlapCandidates/);
  assert.match(board, /const overlapCandidates = countScheduleOverlapCandidates\(list\);/);
  assert.match(board, /copy\.statusConflictCandidatesLabel/);
  assert.match(board, /copy\.statusRequestTrackingHint/);

  assert.ok(
    countLines(board) <= 260,
    `EmployeeScheduleBoard.tsx should stay <= 260 lines (current: ${countLines(board)})`
  );
  assert.ok(
    countLines(boardView) <= 290,
    `EmployeeScheduleBoardView.tsx should stay <= 290 lines (current: ${countLines(boardView)})`
  );

  assert.match(workItem, /WI-0531/i);
  assert.match(workItem, /schedule|conflict|candidate|guidance|tracking/i);
  assert.match(roadmap, /WI-0531/i);
}

run()
  .then(() => {
    console.log("e2e-wi0531-employee-schedule-conflict-candidate-guidance.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

