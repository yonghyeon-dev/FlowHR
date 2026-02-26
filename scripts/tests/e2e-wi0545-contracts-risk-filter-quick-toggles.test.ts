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
  const controls = readUtf8("src", "components", "contracts", "AdminContractsDocumentFilterControls.tsx");
  const inbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0545-contracts-risk-filter-quick-toggles.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(controls, /onSlaRiskFilterChange\("ALL"\)/);
  assert.match(controls, /onSlaRiskFilterChange\("DUE_SOON"\)/);
  assert.match(controls, /onSlaRiskFilterChange\("OVERDUE"\)/);
  assert.match(controls, /copy\.slaRiskFilterLabel/);

  assert.match(inbox, /copy\.riskQuickFilterLabel/);
  assert.match(inbox, /copy\.riskQuickAllAction/);
  assert.match(inbox, /copy\.riskQuickDueSoonAction/);
  assert.match(inbox, /copy\.riskQuickOverdueAction/);
  assert.match(inbox, /setInboxDeadlineFilter\("all"\)/);
  assert.match(inbox, /setInboxDeadlineFilter\("due_soon"\)/);
  assert.match(inbox, /setInboxDeadlineFilter\("overdue"\)/);

  assert.match(copy, /riskQuickFilterLabel:/);
  assert.match(copy, /riskQuickAllAction:/);
  assert.match(copy, /riskQuickDueSoonAction:/);
  assert.match(copy, /riskQuickOverdueAction:/);

  assert.ok(
    countLines(inbox) <= 300,
    `EmployeeContractsInbox.tsx should stay <= 300 lines (current: ${countLines(inbox)})`
  );
  assert.ok(
    countLines(controls) <= 160,
    `AdminContractsDocumentFilterControls.tsx should stay <= 160 lines (current: ${countLines(controls)})`
  );

  assert.match(workItem, /WI-0545/i);
  assert.match(workItem, /contracts|risk|filter|quick|toggle/i);
  assert.match(roadmap, /WI-0545/i);
}

run()
  .then(() => {
    console.log("e2e-wi0545-contracts-risk-filter-quick-toggles.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

