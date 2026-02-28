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
  const escalationEventHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-event-helpers.ts"
  );
  const eventHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-event-payload-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0667-approval-escalation-event-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    /from "@\/features\/approval\/execution-escalation-event-payload-helpers"/.test(
      approvalService
    ) ||
      /from "@\/features\/approval\/execution-escalation-event-payload-helpers"/.test(
        escalationEventHelpers
      ),
    "payload helper should be imported by service or escalation event helper"
  );
  assert.ok(
    /buildApprovalExecutionEscalationRequestedEventPayload\(/.test(approvalService) ||
      /buildApprovalExecutionEscalationRequestedEventPayload\(/.test(escalationEventHelpers),
    "payload helper should be used by service or escalation event helper"
  );
  assert.doesNotMatch(
    approvalService,
    /payload:\s*\{\s*organizationId[\s\S]*candidateCount: items\.length,[\s\S]*items: items\.slice\(0, 100\)/
  );

  assert.match(eventHelpers, /export function buildApprovalExecutionEscalationRequestedEventPayload\(/);
  assert.match(eventHelpers, /asOf: input\.asOf\.toISOString\(\)/);
  assert.match(eventHelpers, /items: input\.items\.slice\(0, 100\)/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(eventHelpers) <= 120,
    `execution-escalation-event-payload-helpers.ts should stay <= 120 lines \(current: ${countLines(
      eventHelpers
    )}\)`
  );

  assert.match(workItem, /WI-0667/i);
  assert.match(workItem, /approval|escalation|event|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0667/i);
}

run()
  .then(() => {
    console.log("e2e-wi0667-approval-escalation-event-payload-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
