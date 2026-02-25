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
  const receiptConsole = readUtf8("src", "components", "payslip-receipts", "PayslipReceiptConsole.tsx");
  const receiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0439-employee-payslip-receipts-search-filter-and-line-budget-hardening.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(receiptConsole, /const \[runsSearchQuery, setRunsSearchQuery\] = useState\(""\);/);
  assert.match(receiptConsole, /const normalizedRunsSearchQuery = runsSearchQuery\.trim\(\)\.toLowerCase\(\);/);
  assert.match(receiptConsole, /const filteredRuns = useMemo\(\(\) => \{/);
  assert.match(receiptConsole, /run\.payslipDistributedAt \?\? ""/);
  assert.match(receiptConsole, /run\.payslipReceiptConfirmedAt \?\? ""/);
  assert.match(receiptConsole, /copy\.runsSearchLabel/);
  assert.match(receiptConsole, /copy\.runsSearchPlaceholder/);
  assert.match(receiptConsole, /copy\.clearSearchAction/);
  assert.match(receiptConsole, /copy\.visibleRunsLabel/);
  assert.match(receiptConsole, /copy\.noFilteredRunsMessage/);
  assert.match(receiptConsole, /filteredRuns\.map\(\(run\) => \(/);
  assert.ok(
    countLines(receiptConsole) <= 300,
    `PayslipReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(receiptConsole)})`
  );

  assert.match(receiptCopy, /runsSearchLabel: string;/);
  assert.match(receiptCopy, /runsSearchPlaceholder: string;/);
  assert.match(receiptCopy, /clearSearchAction: string;/);
  assert.match(receiptCopy, /visibleRunsLabel: string;/);
  assert.match(receiptCopy, /noFilteredRunsMessage: string;/);
  assert.match(receiptCopy, /runsSearchLabel: "Runs search"/);
  assert.match(receiptCopy, /runsSearchPlaceholder: "Search by run ID\/period\/delivery\/receipt"/);

  assert.match(workItem, /WI-0439/i);
  assert.match(workItem, /payslip|receipt|search|filter|line budget|employee/i);
  assert.match(roadmap, /WI-0439/i);
}

run()
  .then(() => {
    console.log("e2e-wi0439-employee-payslip-receipts-search-filter-and-line-budget-hardening.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
