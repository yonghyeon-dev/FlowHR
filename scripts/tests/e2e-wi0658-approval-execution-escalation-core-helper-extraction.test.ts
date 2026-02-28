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
  const escalationHelpers = readUtf8(
    "src",
    "features",
    "approval",
    "execution-escalation-core-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0658-approval-execution-escalation-core-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalService, /from "@\/features\/approval\/execution-escalation-core-helpers"/);
  assert.match(approvalService, /toApprovalExecutionEscalationItems\(/);
  assert.match(approvalService, /resolveApprovalEscalationWebhookConfig\(/);
  assert.match(approvalService, /sendApprovalEscalationWebhook\(/);

  assert.doesNotMatch(approvalService, /function resolveExecutionDomainPriority\(/);
  assert.doesNotMatch(approvalService, /function calculateExecutionStalledHours\(/);
  assert.doesNotMatch(approvalService, /function compareExecutionsByPriority\(/);
  assert.doesNotMatch(approvalService, /function resolveApprovalEscalationWebhookConfig\(/);
  assert.doesNotMatch(approvalService, /async function sendApprovalEscalationWebhook\(/);

  assert.match(escalationHelpers, /export function calculateExecutionStalledHours\(/);
  assert.match(escalationHelpers, /export function compareExecutionsByPriority\(/);
  assert.match(escalationHelpers, /export function toApprovalExecutionEscalationItems\(/);
  assert.match(escalationHelpers, /export function resolveApprovalEscalationWebhookConfig\(/);
  assert.match(escalationHelpers, /export async function sendApprovalEscalationWebhook\(/);
  assert.match(escalationHelpers, /export type ApprovalExecutionEscalationItem = \{/);
  assert.match(escalationHelpers, /export type ApprovalEscalationWebhookProvider = "discord" \| "slack"/);

  assert.ok(
    countLines(approvalService) <= 2100,
    `approval/service.ts should stay <= 2100 lines (current: ${countLines(approvalService)})`
  );

  assert.match(workItem, /WI-0658/i);
  assert.match(workItem, /approval|execution|escalation|core|helper|extraction|line-budget/i);
  assert.match(roadmap, /WI-0658/i);
}

run()
  .then(() => {
    console.log("e2e-wi0658-approval-execution-escalation-core-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
