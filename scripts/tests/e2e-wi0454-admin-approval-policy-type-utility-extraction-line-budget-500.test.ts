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
  const pageSource = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const typesSource = readUtf8("src", "app", "admin", "approval-policy", "page-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0454-admin-approval-policy-type-utility-extraction-line-budget-500.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(pageSource, /from "@\/app\/admin\/approval-policy\/page-types";/);
  assert.match(pageSource, /domainOptions,/);
  assert.doesNotMatch(pageSource, /const domainOptions: ApprovalDomain\[] = \[/);
  assert.ok(
    countLines(pageSource) <= 500,
    `approval-policy/page.tsx should stay <= 500 lines (current: ${countLines(pageSource)})`
  );

  assert.match(typesSource, /export type ApprovalDomain = "ATTENDANCE" \| "LEAVE" \| "PAYROLL";/);
  assert.match(typesSource, /export type ApprovalPolicyDto = \{/);
  assert.match(typesSource, /export type ApprovalDelegationDto = \{/);
  assert.match(typesSource, /export type ApprovalDelegationExpireResultDto = \{/);
  assert.match(typesSource, /export type ApiLog = \{/);
  assert.match(typesSource, /export const domainOptions: ApprovalDomain\[] = \["ATTENDANCE", "LEAVE", "PAYROLL"\];/);
  assert.match(typesSource, /export function toIso\(value: string\)/);

  assert.match(workItem, /WI-0454/i);
  assert.match(workItem, /approval-policy|type|utility|line budget/i);
  assert.match(roadmap, /WI-0454/i);
}

run()
  .then(() => {
    console.log("e2e-wi0454-admin-approval-policy-type-utility-extraction-line-budget-500.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
