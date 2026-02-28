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
  const stageHistoryHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "stage-history-list-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0672-approval-stage-history-list-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/stage-history-list-helpers"/);
  assert.match(approvalService, /const limit = normalizeApprovalStageHistoryListLimit\(input\.limit\);/);
  assert.match(approvalService, /buildApprovalStageHistoryListQueryInput\(\{/);
  assert.doesNotMatch(
    approvalService,
    /export async function listApprovalStageHistory[\s\S]*const limit = input\.limit !== undefined \? Math\.min\(Math\.max\(input\.limit, 1\), 500\) : 100;/
  );
  assert.doesNotMatch(
    approvalService,
    /export async function listApprovalStageHistory[\s\S]*context\.dataAccess\.approvals\.listStageHistory\(\{\s*organizationId,/
  );

  assert.match(stageHistoryHelpers, /export function normalizeApprovalStageHistoryListLimit\(/);
  assert.match(stageHistoryHelpers, /export function buildApprovalStageHistoryListQueryInput\(/);
  assert.match(stageHistoryHelpers, /targetEntityType: input\.targetEntityType\?\.trim\(\),/);
  assert.match(stageHistoryHelpers, /targetEntityId: input\.targetEntityId\?\.trim\(\),/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );
  assert.ok(
    countLines(stageHistoryHelpers) <= 80,
    `stage-history-list-helpers.ts should stay <= 80 lines (current: ${countLines(stageHistoryHelpers)})`
  );

  assert.match(workItem, /WI-0672/i);
  assert.match(workItem, /approval|stage history|list|helper|extraction/i);
  assert.match(roadmap, /WI-0672/i);
}

run()
  .then(() => {
    console.log("e2e-wi0672-approval-stage-history-list-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
