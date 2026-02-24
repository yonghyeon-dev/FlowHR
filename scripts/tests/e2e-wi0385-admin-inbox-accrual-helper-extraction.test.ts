import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const actionHelpers = readUtf8("src", "app", "admin", "page-action-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0385-admin-inbox-accrual-helper-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(actionHelpers, /export async function refreshAdminInboxFromHelper/);
  assert.match(actionHelpers, /export async function confirmPayrollFromHelper/);
  assert.match(actionHelpers, /export async function settleLeaveAccrualFromHelper/);

  assert.match(adminPage, /refreshAdminInboxFromHelper\(\{/);
  assert.match(adminPage, /confirmPayrollFromHelper\(\{/);
  assert.match(adminPage, /settleLeaveAccrualFromHelper\(\{/);

  assert.doesNotMatch(adminPage, /\/api\/attendance\/records\$\{buildQuery/);
  assert.doesNotMatch(adminPage, /\/api\/leave\/accrual\/settle\", \"POST\"/);

  assert.match(workItem, /WI-0385/i);
  assert.match(workItem, /inbox accrual helper extraction/i);
  assert.match(roadmap, /WI-0385/i);
}

run()
  .then(() => {
    console.log("e2e-wi0385-admin-inbox-accrual-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
