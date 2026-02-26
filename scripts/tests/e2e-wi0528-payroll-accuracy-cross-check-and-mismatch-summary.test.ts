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
  const evidence = readUtf8("src", "components", "payroll-year-end", "accuracy-evidence.ts");
  const panel = readUtf8("src", "components", "payroll-year-end", "PayrollAccuracyEvidencePanel.tsx");
  const copy = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0528-payroll-accuracy-cross-check-and-mismatch-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(evidence, /settlement_recalculation_baseline_balance/);
  assert.match(evidence, /function buildSettlementRecalculationCrossChecks/);
  assert.match(evidence, /if \(params\.settlement && params\.recalculation\)/);
  assert.match(evidence, /buildSettlementRecalculationCrossChecks\(/);

  assert.match(panel, /const failedChecks = useMemo/);
  assert.match(panel, /const mismatchSummaryLabel =/);
  assert.match(panel, /const allChecksBalancedLabel =/);
  assert.match(panel, /failedChecks\.length === 0/);
  assert.match(panel, /Mismatch checks/);

  assert.match(copy, /settlement_recalculation_baseline_balance:/);
  assert.match(copy, /Settlement\/recalculation baseline balance/);

  assert.ok(
    countLines(panel) <= 200,
    `PayrollAccuracyEvidencePanel.tsx should stay <= 200 lines (current: ${countLines(panel)})`
  );

  assert.match(workItem, /WI-0528/i);
  assert.match(workItem, /payroll|accuracy|cross-check|mismatch|summary/i);
  assert.match(roadmap, /WI-0528/i);
}

run()
  .then(() => {
    console.log("e2e-wi0528-payroll-accuracy-cross-check-and-mismatch-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

