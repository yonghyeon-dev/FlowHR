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
  const filterHelpers = readUtf8("src", "components", "contracts", "employee-inbox-filter-helpers.ts");
  const responsePanel = readUtf8("src", "components", "contracts", "EmployeeContractsResponsePanel.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0525-employee-contracts-deadline-risk-queue.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(inbox) <= 300,
    `EmployeeContractsInbox.tsx must stay <= 300 lines (current: ${countLines(inbox)})`
  );
  assert.match(inbox, /const \[inboxDeadlineFilter, setInboxDeadlineFilter\] = useState</);
  assert.match(inbox, /"all" \| "due_soon" \| "overdue"/);
  assert.match(inbox, /applyInboxDeadlineFilter/);
  assert.match(inbox, /copy\.inboxDeadlineFilterLabel/);
  assert.match(inbox, /copy\.inboxDeadlineFilterDueSoonOption/);
  assert.match(inbox, /copy\.inboxDeadlineFilterOverdueOption/);
  assert.match(inbox, /copy\.dueSoonCountLabel/);
  assert.match(inbox, /copy\.overdueCountLabel/);
  assert.match(inbox, /<EmployeeContractsResponsePanel/);

  assert.match(filterHelpers, /export type EmployeeInboxDeadlineFilter = "all" \| "due_soon" \| "overdue"/);
  assert.match(filterHelpers, /const DUE_SOON_WINDOW_DAYS = 3/);
  assert.match(filterHelpers, /export function applyInboxDeadlineFilter/);
  assert.match(filterHelpers, /deadlineFilter === "overdue"/);
  assert.match(responsePanel, /export function EmployeeContractsResponsePanel/);

  assert.match(copy, /inboxDeadlineFilterLabel: "Deadline risk"/);
  assert.match(copy, /inboxDeadlineFilterDueSoonOption: "Due soon \(D-3\)"/);
  assert.match(copy, /inboxDeadlineFilterOverdueOption: "Overdue"/);
  assert.match(copy, /dueSoonCountLabel: "Due soon"/);
  assert.match(copy, /overdueCountLabel: "Overdue"/);
  assert.match(copy, /inboxDeadlineFilterLabel: "기한 위험"/);
  assert.match(copy, /inboxDeadlineFilterDueSoonOption: "임박\(3일 이내\)"/);
  assert.match(copy, /inboxDeadlineFilterOverdueOption: "기한 초과"/);

  assert.match(workItem, /WI-0525/i);
  assert.match(workItem, /contracts|deadline|risk|queue|due soon|overdue/i);
  assert.match(roadmap, /WI-0525/i);
}

run()
  .then(() => {
    console.log("e2e-wi0525-employee-contracts-deadline-risk-queue.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
