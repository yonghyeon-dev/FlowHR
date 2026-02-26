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
  const consoleSource = readUtf8("src", "components", "payslip-receipts", "PayslipReceiptConsole.tsx");
  const helpers = readUtf8("src", "components", "payslip-receipts", "payslip-receipt-filter-helpers.ts");
  const copy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0554-employee-payslip-receipt-status-summary-and-filter-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export type PayslipRunsStatusFilter = "all" \| "pending_confirmation" \| "confirmed" \| "undistributed"/);
  assert.match(helpers, /export function filterPayslipRunsByStatus/);
  assert.match(helpers, /export function filterPayslipRunsByQuery/);
  assert.match(helpers, /export function countPendingPayslipRuns/);
  assert.match(helpers, /export function summarizePayslipRunsStatusCounts/);

  assert.match(consoleSource, /from "@\/components\/payslip-receipts\/payslip-receipt-filter-helpers"/);
  assert.match(consoleSource, /const statusCounts = useMemo\(\(\) => summarizePayslipRunsStatusCounts\(runs\), \[runs\]\);/);
  assert.match(consoleSource, /filterPayslipRunsByStatus\(runs, runsStatusFilter\)/);
  assert.match(consoleSource, /filterPayslipRunsByQuery\(statusFilteredRuns, normalizedRunsSearchQuery\)/);
  assert.match(consoleSource, /countPendingPayslipRuns\(filteredRuns\)/);
  assert.match(consoleSource, /copy\.statusCountSummaryLabel/);

  assert.match(copy, /statusCountSummaryLabel: string;/);
  assert.match(copy, /statusCountSummaryLabel: "Status summary"/);

  assert.ok(
    countLines(consoleSource) <= 300,
    `PayslipReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(workItem, /WI-0554/i);
  assert.match(workItem, /payslip|receipt|status summary|filter|helper|extraction/i);
  assert.match(roadmap, /WI-0554/i);
}

run()
  .then(() => {
    console.log("e2e-wi0554-employee-payslip-receipt-status-summary-and-filter-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
