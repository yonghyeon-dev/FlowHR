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
  const workItem = readUtf8("work-items", "WI-0438-employee-contracts-inbox-search-filter.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeInbox, /const \[searchQuery, setSearchQuery\] = useState\(""\);/);
  assert.match(employeeInbox, /const normalizedSearchQuery = searchQuery\.trim\(\)\.toLowerCase\(\);/);
  assert.match(employeeInbox, /const filteredDocuments = useMemo\(\(\) => \{/);
  assert.match(employeeInbox, /document\.responseComment \?\? ""/);
  assert.match(employeeInbox, /copy\.inboxSearchLabel/);
  assert.match(employeeInbox, /copy\.inboxSearchPlaceholder/);
  assert.match(employeeInbox, /copy\.clearSearchAction/);
  assert.match(employeeInbox, /copy\.visibleCountLabel/);
  assert.match(employeeInbox, /copy\.inboxFilteredEmpty/);
  assert.match(employeeInbox, /filteredDocuments\.map\(\(document\) => \(/);
  assert.ok(
    countLines(employeeInbox) <= 300,
    `EmployeeContractsInbox.tsx must stay <= 300 lines (current: ${countLines(employeeInbox)})`
  );

  assert.match(contractsCopy, /inboxSearchLabel: "Inbox search"/);
  assert.match(contractsCopy, /inboxSearchPlaceholder: "Search by title\/document ID\/status"/);
  assert.match(contractsCopy, /clearSearchAction: "Clear search"/);
  assert.match(contractsCopy, /visibleCountLabel: "Visible documents"/);
  assert.match(contractsCopy, /inboxFilteredEmpty: "No documents match the current search\."/);
  assert.match(contractsCopy, /inboxSearchLabel: "\\uBC1B\\uC740\\uD568 \\uAC80\\uC0C9"/);

  assert.match(workItem, /WI-0438/i);
  assert.match(workItem, /contracts|inbox|search|filter|employee|journey/i);
  assert.match(roadmap, /WI-0438/i);
}

run()
  .then(() => {
    console.log("e2e-wi0438-employee-contracts-inbox-search-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
