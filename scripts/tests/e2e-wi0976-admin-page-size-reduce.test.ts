import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const wi = readUtf8("work-items", "WI-0976-admin-page-size-reduce.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const approvalActions = readUtf8("src", "app", "admin", "page-approval-actions.ts");

  assert.match(wi, /WI-0976/);
  assert.match(wi, /500/);
  assert.match(wi, /page-approval-actions\.ts/);

  assert.ok(countLines(adminPage) <= 500, "admin/page.tsx must stay <= 500 lines");

  assert.match(adminPage, /useAdminApprovalQuickActions/);
  assert.match(adminPage, /runApprovalQuickAction\("leave"\)/);
  assert.match(adminPage, /runApprovalQuickAction\("attendance"\)/);
  assert.doesNotMatch(adminPage, /async function runApprovalQuickAction/);

  assert.match(approvalActions, /export function useAdminApprovalQuickActions/);
  assert.match(approvalActions, /performAdminApiCall/);
  assert.match(approvalActions, /setApprovalQuickActionPending/);
}

run();
console.log("e2e-wi0976-admin-page-size-reduce.test passed");
