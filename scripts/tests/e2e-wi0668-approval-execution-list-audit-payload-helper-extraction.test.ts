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
    "WI-0668-approval-execution-list-audit-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    /buildApprovalExecutionListedAuditPayload\(/.test(approvalService) ||
      /buildApprovalExecutionListedAuditPayload\(/.test(listAuditEntryHelpers),
    "execution listed audit payload helper should be used by service or list-audit-entry helper"
  );
  assert.ok(
    /action: "approval\.execution\.listed"[\s\S]*payload: buildApprovalExecutionListedAuditPayload\(/.test(
      approvalService
    ) ||
      /action: "approval\.execution\.listed"[\s\S]*payload: buildApprovalExecutionListedAuditPayload\(/.test(
        listAuditEntryHelpers
      ),
    "execution listed audit action/payload mapping should exist in service or list-audit-entry helper"
  );
  assert.doesNotMatch(
    approvalService,
    /action: "approval\.execution\.listed"[\s\S]*payload:\s*\{[\s\S]*targetEntityType: input\.targetEntityType \?\? null/
  );

  assert.match(auditHelpers, /export function buildApprovalExecutionListedAuditPayload\(/);
  assert.match(auditHelpers, /stalledHoursMin: input\.stalledHoursMin \?\? null/);
  assert.match(auditHelpers, /asOf: input\.asOf\.toISOString\(\)/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(auditHelpers) <= 220,
    `approval/audit-payload-helpers.ts should stay <= 220 lines \(current: ${countLines(auditHelpers)}\)`
  );

  assert.match(workItem, /WI-0668/i);
  assert.match(workItem, /approval|execution|list|audit|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0668/i);
}

run()
  .then(() => {
    console.log("e2e-wi0668-approval-execution-list-audit-payload-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
