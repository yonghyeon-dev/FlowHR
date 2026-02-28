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
  const listAuditHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "list-audit-entry-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0694-approval-list-audit-actor-context-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /buildApprovalListAuditActorContext\(\{/);
  assert.match(approvalService, /actor: listAuditActor/);

  assert.match(listAuditHelpers, /export function buildApprovalListAuditActorContext\(/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );

  assert.match(workItem, /WI-0694/i);
  assert.match(workItem, /approval|list|audit|actor|context|helper|extraction/i);
  assert.match(roadmap, /WI-0694/i);
}

run()
  .then(() => {
    console.log("e2e-wi0694-approval-list-audit-actor-context-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
