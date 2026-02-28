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
  const listAuditEntryHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "list-audit-entry-helpers.ts"
  );
  const auditHelpers = readUtf8("src", "features", "approval", "audit-payload-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0663-approval-stage-history-audit-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/audit-payload-helpers"/);
  assert.ok(
    /buildApprovalStageHistoryListedAuditPayload\(/.test(approvalService) ||
      /buildApprovalStageHistoryListedAuditPayload\(/.test(listAuditEntryHelpers),
    "stage-history listed audit payload helper should be used by service or list-audit-entry helper"
  );
  assert.match(approvalService, /buildApprovalExecutionEscalationAuditPayloadBase\(/);
  assert.match(approvalService, /buildApprovalExecutionEscalationFailureAuditPayload\(/);
  assert.ok(
    /action: "approval\.stage_history\.listed"[\s\S]*payload: buildApprovalStageHistoryListedAuditPayload\(/.test(
      approvalService
    ) ||
      /action: "approval\.stage_history\.listed"[\s\S]*payload: buildApprovalStageHistoryListedAuditPayload\(/.test(
        listAuditEntryHelpers
      ),
    "stage-history listed audit action/payload mapping should exist in service or list-audit-entry helper"
  );
  assert.doesNotMatch(approvalService, /const payloadBase = \{/);

  assert.match(auditHelpers, /export function buildApprovalStageHistoryListedAuditPayload\(/);
  assert.match(auditHelpers, /export function buildApprovalExecutionEscalationAuditPayloadBase\(/);
  assert.match(auditHelpers, /export function buildApprovalExecutionEscalationFailureAuditPayload\(/);
  assert.match(auditHelpers, /requestedAt: input\.requestedAt/);
  assert.match(auditHelpers, /reason: input\.reason/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(auditHelpers) <= 180,
    `approval/audit-payload-helpers.ts should stay <= 180 lines \(current: ${countLines(auditHelpers)}\)`
  );

  assert.match(workItem, /WI-0663/i);
  assert.match(workItem, /approval|stage-history|audit|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0663/i);
}

run()
  .then(() => {
    console.log("e2e-wi0663-approval-stage-history-audit-payload-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
