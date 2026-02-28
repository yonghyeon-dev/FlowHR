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
  const messageHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-message-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0673-approval-escalation-message-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    approvalService,
    /from "@\/features\/approval\/execution-escalation-message-helpers"/
  );
  assert.match(approvalService, /const message = buildApprovalExecutionEscalationMessage\(\{/);
  assert.doesNotMatch(approvalService, /function buildApprovalExecutionEscalationMessage\(/);

  assert.match(
    messageHelpers,
    /export function buildApprovalExecutionEscalationMessage\(input: \{/
  );
  assert.match(messageHelpers, /const title = input\.dryRun/);
  assert.match(messageHelpers, /for \(const item of input\.items\.slice\(0, 50\)\)/);
  assert.match(messageHelpers, /return lines\.join\("\\n"\);/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );
  assert.ok(
    countLines(messageHelpers) <= 120,
    `execution-escalation-message-helpers.ts should stay <= 120 lines (current: ${countLines(messageHelpers)})`
  );

  assert.match(workItem, /WI-0673/i);
  assert.match(workItem, /approval|escalation|message|helper|extraction/i);
  assert.match(roadmap, /WI-0673/i);
}

run()
  .then(() => {
    console.log("e2e-wi0673-approval-escalation-message-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
