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
  const readHelpers = readUtf8("src", "features", "approval", "policy-read-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0664-approval-policy-read-path-helper-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/policy-read-helpers"/);
  assert.match(approvalService, /resolveApprovalGatePreviewActorContext\(/);
  assert.match(approvalService, /toApprovalPolicyGatePreview\(/);
  assert.match(approvalService, /buildApprovalPolicyGatePreviewAuditPayload\(/);
  assert.match(approvalService, /return resolveApprovalPolicyReadResult\(policy, organizationId, toPolicyFallback\);/);

  assert.doesNotMatch(
    approvalService,
    /return \{\s*policy: policy \?\? toPolicyFallback\(organizationId\),\s*configured: policy !== null\s*\};/
  );

  assert.match(readHelpers, /export function resolveApprovalPolicyReadResult\(/);
  assert.match(readHelpers, /export function resolveApprovalGatePreviewActorContext\(/);
  assert.match(readHelpers, /export function toApprovalPolicyGatePreview\(/);
  assert.match(readHelpers, /export function buildApprovalPolicyGatePreviewAuditPayload\(/);
  assert.match(readHelpers, /export type ApprovalPolicyGatePreview = \{/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines \(current: ${countLines(approvalService)}\)`
  );
  assert.ok(
    countLines(readHelpers) <= 260,
    `approval/policy-read-helpers.ts should stay <= 260 lines \(current: ${countLines(readHelpers)}\)`
  );

  assert.match(workItem, /WI-0664/i);
  assert.match(workItem, /approval|policy|gate|read|path|helper|decomposition/i);
  assert.match(roadmap, /WI-0664/i);
}

run()
  .then(() => {
    console.log("e2e-wi0664-approval-policy-read-path-helper-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
