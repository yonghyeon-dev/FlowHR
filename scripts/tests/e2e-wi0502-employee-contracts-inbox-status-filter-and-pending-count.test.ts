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
  const employeeInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0502-employee-contracts-inbox-status-filter-and-pending-count.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeInbox, /const \[inboxStatusFilter, setInboxStatusFilter\] = useState</);
  assert.match(employeeInbox, /"all" \| "pending_response" \| "responded" \| "expired"/);
  assert.match(employeeInbox, /const statusFilteredDocuments = useMemo\(\(\) => \{/);
  assert.match(employeeInbox, /canEmployeeRespondToContractDocument\(document\.status\)/);
  assert.match(employeeInbox, /copy\.inboxStatusFilterLabel/);
  assert.match(employeeInbox, /copy\.inboxStatusFilterAllOption/);
  assert.match(employeeInbox, /copy\.inboxStatusFilterPendingOption/);
  assert.match(employeeInbox, /copy\.inboxStatusFilterRespondedOption/);
  assert.match(employeeInbox, /copy\.inboxStatusFilterExpiredOption/);
  assert.match(employeeInbox, /copy\.pendingResponseCountLabel/);
  assert.ok(
    countLines(employeeInbox) <= 300,
    `EmployeeContractsInbox.tsx must stay <= 300 lines (current: ${countLines(employeeInbox)})`
  );

  assert.match(contractsCopy, /inboxStatusFilterLabel: "Status filter"/);
  assert.match(contractsCopy, /inboxStatusFilterPendingOption: "Pending response"/);
  assert.match(contractsCopy, /pendingResponseCountLabel: "Pending response"/);
  assert.match(contractsCopy, /inboxStatusFilterLabel: "상태 필터"/);
  assert.match(contractsCopy, /inboxStatusFilterPendingOption: "응답 대기"/);
  assert.match(contractsCopy, /pendingResponseCountLabel: "응답 대기 건"/);

  assert.match(workItem, /WI-0502/i);
  assert.match(workItem, /contracts|inbox|status|pending|response|filter/i);
  assert.match(roadmap, /WI-0502/i);
}

run()
  .then(() => {
    console.log("e2e-wi0502-employee-contracts-inbox-status-filter-and-pending-count.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
