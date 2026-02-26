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
  const workItem = readUtf8(
    "work-items",
    "WI-0500-employee-payslip-receipt-status-filter-pending-focus.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(receiptConsole, /const \[runsStatusFilter, setRunsStatusFilter\] = useState</);
  assert.match(receiptConsole, /pending_confirmation/);
  assert.match(receiptConsole, /const statusFilteredRuns = useMemo\(\(\) => \{/);
  assert.match(receiptConsole, /copy\.runsStatusFilterLabel/);
  assert.match(receiptConsole, /copy\.runsStatusFilterAllOption/);
  assert.match(receiptConsole, /copy\.runsStatusFilterPendingOption/);
  assert.match(receiptConsole, /copy\.runsStatusFilterConfirmedOption/);
  assert.match(receiptConsole, /copy\.runsStatusFilterUndistributedOption/);
  assert.match(receiptConsole, /copy\.visiblePendingRunsLabel/);
  assert.match(receiptConsole, /const pendingRunsInViewCount = useMemo\(/);
  assert.ok(
    countLines(receiptConsole) <= 300,
    `PayslipReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(receiptConsole)})`
  );

  assert.match(receiptCopy, /runsStatusFilterLabel: string;/);
  assert.match(receiptCopy, /runsStatusFilterAllOption: string;/);
  assert.match(receiptCopy, /runsStatusFilterPendingOption: string;/);
  assert.match(receiptCopy, /runsStatusFilterConfirmedOption: string;/);
  assert.match(receiptCopy, /runsStatusFilterUndistributedOption: string;/);
  assert.match(receiptCopy, /visiblePendingRunsLabel: string;/);
  assert.match(receiptCopy, /runsStatusFilterLabel: "Run status filter"/);
  assert.match(receiptCopy, /runsStatusFilterPendingOption: "Pending receipt confirmation"/);

  assert.match(workItem, /WI-0500/i);
  assert.match(workItem, /payslip|receipt|status filter|pending/i);
  assert.match(roadmap, /WI-0500/i);
}

run()
  .then(() => {
    console.log("e2e-wi0500-employee-payslip-receipt-status-filter-pending-focus.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
