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
  const auditEntryHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-audit-entry-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0690-approval-escalation-error-message-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /toApprovalExecutionEscalationErrorMessage\(error\)/);
  assert.doesNotMatch(
    approvalService,
    /error instanceof Error \? error\.message : "unknown error"/
  );

  assert.match(
    auditEntryHelpers,
    /export function toApprovalExecutionEscalationErrorMessage\(error: unknown\)/
  );
  assert.match(
    auditEntryHelpers,
    /return error instanceof Error \? error\.message : "unknown error";/
  );

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );

  assert.match(workItem, /WI-0690/i);
  assert.match(workItem, /approval|escalation|error message|helper|extraction/i);
  assert.match(roadmap, /WI-0690/i);
}

run()
  .then(() => {
    console.log("e2e-wi0690-approval-escalation-error-message-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
