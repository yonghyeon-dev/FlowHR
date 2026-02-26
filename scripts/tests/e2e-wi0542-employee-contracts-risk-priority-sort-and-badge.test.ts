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
  const inbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const helpers = readUtf8("src", "components", "contracts", "employee-inbox-filter-helpers.ts");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0542-employee-contracts-risk-priority-sort-and-badge.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(inbox, /sortInboxDocumentsByRisk/);
  assert.match(inbox, /isDueSoonPendingDocument/);
  assert.match(inbox, /isOverduePendingDocument/);
  assert.match(inbox, /copy\.dueSoonBadgeLabel/);
  assert.match(inbox, /copy\.overdueBadgeLabel/);
  assert.match(inbox, /return sortInboxDocumentsByRisk\(baseDocuments\)/);

  assert.match(helpers, /export function isDueSoonPendingDocument/);
  assert.match(helpers, /export function isOverduePendingDocument/);
  assert.match(helpers, /export function sortInboxDocumentsByRisk/);
  assert.match(helpers, /leftOverdue/);
  assert.match(helpers, /leftDueSoon/);

  assert.match(copy, /dueSoonBadgeLabel:/);
  assert.match(copy, /overdueBadgeLabel:/);

  assert.ok(
    countLines(inbox) <= 300,
    `EmployeeContractsInbox.tsx should stay <= 300 lines (current: ${countLines(inbox)})`
  );

  assert.match(workItem, /WI-0542/i);
  assert.match(workItem, /employee|contracts|risk|priority|sort|badge/i);
  assert.match(roadmap, /WI-0542/i);
}

run()
  .then(() => {
    console.log("e2e-wi0542-employee-contracts-risk-priority-sort-and-badge.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

