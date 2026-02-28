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
  const eventHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-event-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0675-approval-escalation-event-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    approvalService,
    /from "@\/features\/approval\/execution-escalation-event-helpers"/
  );
  assert.match(approvalService, /buildApprovalExecutionEscalationRequestedEvent\(\{/);
  assert.doesNotMatch(approvalService, /buildApprovalExecutionEscalationRequestedEventPayload\(\{/);

  assert.match(eventHelpers, /export function buildApprovalExecutionEscalationRequestedEvent\(/);
  assert.match(
    eventHelpers,
    /buildApprovalExecutionEscalationRequestedEventPayload\(\{[\s\S]*candidateCount: input\.items\.length,/
  );
  assert.match(eventHelpers, /name: "approval\.execution\.escalation\.requested\.v1"/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );
  assert.ok(
    countLines(eventHelpers) <= 120,
    `execution-escalation-event-helpers.ts should stay <= 120 lines (current: ${countLines(eventHelpers)})`
  );

  assert.match(workItem, /WI-0675/i);
  assert.match(workItem, /approval|escalation|event|helper|extraction/i);
  assert.match(roadmap, /WI-0675/i);
}

run()
  .then(() => {
    console.log("e2e-wi0675-approval-escalation-event-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
