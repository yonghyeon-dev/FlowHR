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
  const approvalService = readUtf8("src", "features", "approval", "service.ts");
  const inputHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-input-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0669-approval-escalation-input-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/execution-escalation-input-helpers"/);
  assert.match(approvalService, /normalizeApprovalExecutionEscalationPolicy\(/);
  assert.match(approvalService, /selectApprovalExecutionEscalationCandidates\(/);
  assert.doesNotMatch(
    approvalService,
    /const stalledHoursMin =[\s\S]*Math\.max\(1, Math\.min\(input\.stalledHoursMin, 24 \* 365\)\)/
  );
  assert.doesNotMatch(
    approvalService,
    /executions = executions\.filter\([\s\S]*calculateExecutionStalledHours\(execution, asOf\) >= stalledHoursMin/
  );

  assert.match(inputHelpers, /export function normalizeApprovalExecutionEscalationPolicy\(/);
  assert.match(inputHelpers, /export function selectApprovalExecutionEscalationCandidates\(/);
  assert.match(inputHelpers, /notificationChannel: string \| undefined/);
  assert.match(inputHelpers, /compareExecutionsByPriority\(left, right, input\.asOf\)/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(inputHelpers) <= 120,
    `execution-escalation-input-helpers.ts should stay <= 120 lines \(current: ${countLines(inputHelpers)}\)`
  );

  assert.match(workItem, /WI-0669/i);
  assert.match(workItem, /approval|escalation|input|helper|extraction/i);
  assert.match(roadmap, /WI-0669/i);
}

run()
  .then(() => {
    console.log("e2e-wi0669-approval-escalation-input-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
