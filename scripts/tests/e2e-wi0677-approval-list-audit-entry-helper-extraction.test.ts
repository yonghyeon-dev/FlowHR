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
    "list-audit-entry-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0677-approval-list-audit-entry-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/list-audit-entry-helpers"/);
  assert.match(approvalService, /buildApprovalStageHistoryListedAuditEntry\(\{/);
  assert.match(approvalService, /buildApprovalExecutionListedAuditEntry\(\{/);
  assert.doesNotMatch(
    approvalService,
    /action: "approval\.stage_history\.listed"[\s\S]*buildApprovalStageHistoryListedAuditPayload\(\{/
  );
  assert.doesNotMatch(
    approvalService,
    /action: "approval\.execution\.listed"[\s\S]*buildApprovalExecutionListedAuditPayload\(\{/
  );

  assert.match(auditEntryHelpers, /export function buildApprovalStageHistoryListedAuditEntry\(/);
  assert.match(auditEntryHelpers, /buildApprovalStageHistoryListedAuditPayload\(/);
  assert.match(auditEntryHelpers, /export function buildApprovalExecutionListedAuditEntry\(/);
  assert.match(auditEntryHelpers, /buildApprovalExecutionListedAuditPayload\(/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );
  assert.ok(
    countLines(auditEntryHelpers) <= 180,
    `list-audit-entry-helpers.ts should stay <= 180 lines (current: ${countLines(auditEntryHelpers)})`
  );

  assert.match(workItem, /WI-0677/i);
  assert.match(workItem, /approval|list|audit|entry|helper|extraction/i);
  assert.match(roadmap, /WI-0677/i);
}

run()
  .then(() => {
    console.log("e2e-wi0677-approval-list-audit-entry-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
