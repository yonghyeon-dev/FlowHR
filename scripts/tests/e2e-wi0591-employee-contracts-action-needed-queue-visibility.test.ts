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
    "WI-0591-employee-contracts-action-needed-queue-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export type EmployeeInboxDeadlineFilter = "all" \| "action_needed" \| "due_soon" \| "overdue"/);
  assert.match(helpers, /if \(deadlineFilter === "action_needed"\)/);
  assert.match(helpers, /export function isActionNeededPendingDocument\(/);
  assert.match(helpers, /export function countActionNeededPending\(/);

  assert.match(inbox, /countActionNeededPending/);
  assert.match(inbox, /const \[inboxDeadlineFilter, setInboxDeadlineFilter\] = useState<EmployeeInboxDeadlineFilter>/);
  assert.match(inbox, /const actionNeededCount = useMemo\(\(\) => countActionNeededPending\(filteredDocuments\)/);
  assert.match(inbox, /<option value="action_needed">\{copy\.inboxDeadlineFilterActionNeededOption\}<\/option>/);
  assert.match(inbox, /setInboxDeadlineFilter\("action_needed"\)/);
  assert.match(inbox, /copy\.riskQuickActionNeededAction/);
  assert.match(inbox, /copy\.actionNeededCountLabel/);

  assert.match(copy, /inboxDeadlineFilterActionNeededOption:/);
  assert.match(copy, /riskQuickActionNeededAction:/);
  assert.match(copy, /actionNeededCountLabel:/);

  assert.ok(
    countLines(inbox) <= 300,
    `EmployeeContractsInbox.tsx should stay <= 300 lines (current: ${countLines(inbox)})`
  );

  assert.match(workItem, /WI-0591/i);
  assert.match(workItem, /employee|contracts|action needed|queue|filter|summary/i);
  assert.match(roadmap, /WI-0591/i);
}

run()
  .then(() => {
    console.log("e2e-wi0591-employee-contracts-action-needed-queue-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
