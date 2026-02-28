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
    "WI-0684-approval-escalation-audit-entry-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    approvalService,
    /from "@\/features\/approval\/execution-escalation-audit-entry-helpers"/
  );
  assert.match(approvalService, /buildApprovalExecutionEscalationGeneratedAuditEntry\(\{/);
  assert.match(approvalService, /buildApprovalExecutionEscalationRequestedAuditEntry\(\{/);
  assert.match(approvalService, /buildApprovalExecutionEscalationFailedAuditEntry\(\{/);
  assert.match(
    approvalService,
    /buildApprovalExecutionEscalationEventPublishFailedAuditEntry\(\{/
  );
  assert.doesNotMatch(
    approvalService,
    /action: "approval\.execution\.escalation\.generated"[\s\S]*payload: payloadBase/
  );
  assert.doesNotMatch(
    approvalService,
    /action: "approval\.execution\.escalation\.requested"[\s\S]*payload: payloadBase/
  );

  assert.match(
    auditEntryHelpers,
    /export function buildApprovalExecutionEscalationGeneratedAuditEntry\(/
  );
  assert.match(
    auditEntryHelpers,
    /export function buildApprovalExecutionEscalationRequestedAuditEntry\(/
  );
  assert.match(auditEntryHelpers, /export function buildApprovalExecutionEscalationFailedAuditEntry\(/);
  assert.match(
    auditEntryHelpers,
    /export function buildApprovalExecutionEscalationEventPublishFailedAuditEntry\(/
  );

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );
  assert.ok(
    countLines(auditEntryHelpers) <= 160,
    `execution-escalation-audit-entry-helpers.ts should stay <= 160 lines (current: ${countLines(auditEntryHelpers)})`
  );

  assert.match(workItem, /WI-0684/i);
  assert.match(workItem, /approval|escalation|audit|entry|helper|extraction/i);
  assert.match(roadmap, /WI-0684/i);
}

run()
  .then(() => {
    console.log("e2e-wi0684-approval-escalation-audit-entry-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
