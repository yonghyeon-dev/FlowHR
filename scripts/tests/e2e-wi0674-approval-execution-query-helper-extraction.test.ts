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
  const executionQueryHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-query-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0674-approval-execution-query-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/execution-query-helpers"/);
  assert.match(approvalService, /buildApprovalExecutionListQueryInput\(\{/);
  assert.match(approvalService, /buildPendingApprovalExecutionQueryInput\(\{/);
  assert.doesNotMatch(
    approvalService,
    /export async function listApprovalExecutions[\s\S]*context\.dataAccess\.approvals\.listExecutions\(\{\s*organizationId,\s*domain: input\.domain,\s*targetEntityType: input\.targetEntityType\?\.trim\(\),/
  );
  assert.doesNotMatch(
    approvalService,
    /export async function triggerApprovalExecutionEscalation[\s\S]*context\.dataAccess\.approvals\.listExecutions\(\{\s*organizationId,\s*domain: input\.domain,\s*state: "PENDING"/
  );

  assert.match(executionQueryHelpers, /export function buildApprovalExecutionListQueryInput\(/);
  assert.match(executionQueryHelpers, /targetEntityType: input\.targetEntityType\?\.trim\(\),/);
  assert.match(executionQueryHelpers, /targetEntityId: input\.targetEntityId\?\.trim\(\),/);
  assert.match(executionQueryHelpers, /export function buildPendingApprovalExecutionQueryInput\(/);
  assert.match(executionQueryHelpers, /state: "PENDING" as const/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );
  assert.ok(
    countLines(executionQueryHelpers) <= 100,
    `execution-query-helpers.ts should stay <= 100 lines (current: ${countLines(executionQueryHelpers)})`
  );

  assert.match(workItem, /WI-0674/i);
  assert.match(workItem, /approval|execution|query|helper|extraction/i);
  assert.match(roadmap, /WI-0674/i);
}

run()
  .then(() => {
    console.log("e2e-wi0674-approval-execution-query-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
