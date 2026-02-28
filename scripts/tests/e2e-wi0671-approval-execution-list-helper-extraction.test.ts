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
  const listHelpers = readUtf8("src", "features", "approval", "execution-list-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0671-approval-execution-list-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/execution-list-helpers"/);
  assert.match(approvalService, /normalizeApprovalExecutionListOptions\(\{/);
  assert.match(approvalService, /rows = selectApprovalExecutionsForList\(\{/);
  assert.doesNotMatch(
    approvalService,
    /export async function listApprovalExecutions[\s\S]*const limit = input\.limit !== undefined \? Math\.min\(Math\.max\(input\.limit, 1\), 500\) : 100;/
  );
  assert.doesNotMatch(
    approvalService,
    /if \(sort === "priority_desc"\) \{[\s\S]*compareExecutionsByPriority\(left, right, asOf\)/
  );

  assert.match(listHelpers, /export type ApprovalExecutionListSort = "updated_desc" \| "priority_desc"/);
  assert.match(listHelpers, /export function normalizeApprovalExecutionListOptions\(/);
  assert.match(listHelpers, /export function selectApprovalExecutionsForList\(/);
  assert.match(listHelpers, /calculateExecutionStalledHours\(row, input\.asOf\) >= stalledHoursMin/);
  assert.match(listHelpers, /compareExecutionsByPriority\(left, right, input\.asOf\)/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(listHelpers) <= 140,
    `execution-list-helpers.ts should stay <= 140 lines \(current: ${countLines(listHelpers)}\)`
  );

  assert.match(workItem, /WI-0671/i);
  assert.match(workItem, /approval|execution|list|helper|extraction/i);
  assert.match(roadmap, /WI-0671/i);
}

run()
  .then(() => {
    console.log("e2e-wi0671-approval-execution-list-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
