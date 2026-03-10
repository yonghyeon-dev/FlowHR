import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPayrollPanel = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const workItem = readUtf8("work-items", "WI-0342-locale-residual-gap-fix-payroll-panel.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPayrollPanel, /const fieldCopy = isKoLocale/);
  assert.match(adminPayrollPanel, /previewMode: "프리뷰 모드"/);
  assert.match(adminPayrollPanel, /previewMode: "Preview mode"/);
  assert.match(adminPayrollPanel, /nonTaxableIncome: "비과세 소득\(KRW\)"/);
  assert.match(adminPayrollPanel, /nonTaxableIncome: "Non-taxable income \(KRW\)"/);
  assert.match(adminPayrollPanel, /confirmTarget: "확정 대상 프리뷰"/);
  assert.match(adminPayrollPanel, /confirmTarget: "Preview to confirm"/);
  assert.match(adminPayrollPanel, /previewedPayroll\.map\(\(run\) => \(/);
  assert.doesNotMatch(adminPayrollPanel, /lastRunIdPlaceholder/);
  assert.match(adminPayrollPanel, /\{fieldCopy\.createPreview\}/);
  assert.match(adminPayrollPanel, /\{fieldCopy\.confirmRun\}/);

  assert.match(workItem, /WI-0342/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0342/i);
}

run()
  .then(() => {
    console.log("e2e-wi0342-locale-residual-gap-fix-payroll-panel.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
