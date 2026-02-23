import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  const payrollRfc = readUtf8("specs", "payroll", "rfc.md");
  const roadmap = readUtf8("ROADMAP.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const consistencyPanel = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitConsistencyGuidePanel.tsx"
  );
  const consistencyHelper = readUtf8(
    "src",
    "features",
    "payroll",
    "kr-income-split-item-consistency.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0229-payroll-kr-preset-manual-consistency-ux-guide.md"
  );

  assert.match(payrollApiSpec, /consistency preflight/i);
  assert.match(payrollContract, /WI-0229|consistency UX guide/i);
  assert.match(payrollTestCases, /Consistency UX Gate/i);
  assert.match(payrollRfc, /WI-0229/);
  assert.match(roadmap, /WI-0229/);
  assert.match(adminPage, /PayrollKrIncomeSplitConsistencyGuidePanel/);
  assert.match(adminPage, /analyzePayrollKrIncomeSplitDraftConsistency/);
  assert.match(consistencyPanel, /manual mode/i);
  assert.match(consistencyHelper, /hasBlockingIssues/);
  assert.match(workItem, /client preflight/i);

  const { analyzePayrollKrIncomeSplitDraftConsistency } = await import(
    "../../src/features/payroll/kr-income-split-item-consistency.ts"
  );

  const invalidSummary = analyzePayrollKrIncomeSplitDraftConsistency({
    taxableItems: [
      { code: "TX_SALARY", category: "salary", amountKrw: "50000" },
      { code: "TX_SALARY", category: "salary", amountKrw: "36000" },
      { code: "TX_UNKNOWN", category: "salary", amountKrw: "1000" },
      { code: "TX_BONUS", category: "", amountKrw: "1000" }
    ],
    nonTaxableItems: [{ code: "NT_MEAL", category: "bonus", amountKrw: "10000" }]
  });
  assert.equal(invalidSummary.hasBlockingIssues, true);
  assert.ok(
    invalidSummary.taxable.duplicateCodeRowIndexes.length >= 2,
    "duplicate taxable code rows should be detected"
  );
  assert.ok(
    invalidSummary.taxable.unsupportedCodeRowIndexes.length >= 1,
    "unsupported taxable code rows should be detected"
  );
  assert.ok(
    invalidSummary.taxable.partialRowIndexes.length >= 1,
    "partial taxable rows should be detected"
  );
  assert.ok(
    invalidSummary.nonTaxable.categoryMismatchRowIndexes.length >= 1,
    "non-taxable category mismatch rows should be detected"
  );

  const validSummary = analyzePayrollKrIncomeSplitDraftConsistency({
    taxableItems: [
      { code: "TX_SALARY", category: "salary", amountKrw: "86000" },
      { code: "TX_BONUS", category: "bonus", amountKrw: "14000" }
    ],
    nonTaxableItems: [
      { code: "NT_MEAL", category: "allowance", amountKrw: "10000" },
      { code: "NT_COMMUTE", category: "allowance", amountKrw: "5000" }
    ]
  });
  assert.equal(validSummary.hasBlockingIssues, false);
  assert.equal(validSummary.enteredManualRowCount, 4);
}

run()
  .then(() => {
    console.log("e2e-wi0229-payroll-kr-preset-manual-consistency-ux-guide.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
