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
  const responseHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-response-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0670-approval-escalation-response-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    approvalService,
    /from "@\/features\/approval\/execution-escalation-response-helpers"/
  );
  assert.match(approvalService, /Promise<ApprovalExecutionEscalationResponse>/);
  assert.match(approvalService, /return buildApprovalExecutionEscalationResponse\(\{/);
  assert.doesNotMatch(
    approvalService,
    /requested: !dryRun && items\.length > 0 \? items\.length : 0/
  );

  assert.match(responseHelpers, /export type ApprovalExecutionEscalationResponse = \{/);
  assert.match(responseHelpers, /export function buildApprovalExecutionEscalationResponse\(/);
  assert.match(responseHelpers, /requested: !input\.dryRun && input\.items\.length > 0 \? input\.items\.length : 0/);
  assert.match(responseHelpers, /webhookConfigured: input\.provider !== null/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(responseHelpers) <= 180,
    `execution-escalation-response-helpers.ts should stay <= 180 lines \(current: ${countLines(
      responseHelpers
    )}\)`
  );

  assert.match(workItem, /WI-0670/i);
  assert.match(workItem, /approval|escalation|response|helper|extraction/i);
  assert.match(roadmap, /WI-0670/i);
}

run()
  .then(() => {
    console.log("e2e-wi0670-approval-escalation-response-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
