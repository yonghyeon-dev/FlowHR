import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1158-route-first-workspace-visual-wave-seventeen.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const closeConsole = readUtf8("src", "components", "payroll-close", "PayrollClosePeriodConsole.tsx");
  const deliveryConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const insuranceConsole = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const insuranceInput = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementInputPanel.tsx"
  );
  const insuranceSections = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementSections.tsx"
  );
  const preflightConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndPreflightConsole.tsx"
  );

  assert.match(wi, /WI-1158/);
  assert.match(
    progress,
    /Closed `WI-1157` through the full GitHub flow and merged it to `main` as `2ccb48815efabd3c0058837210886c03971993cc`/
  );
  assert.match(progress, /Started `WI-1158`/);

  assert.match(closeConsole, /workspace-shell admin-workspace-shell/);
  assert.match(closeConsole, /workspace-summary-strip/);
  assert.match(closeConsole, /workspace-toolbar-card/);
  assert.match(closeConsole, /href="\/admin"/);

  assert.match(deliveryConsole, /workspace-shell admin-workspace-shell/);
  assert.match(deliveryConsole, /workspace-summary-strip/);
  assert.match(deliveryConsole, /workspace-toolbar-card/);
  assert.match(deliveryConsole, /workspace-note-card/);

  assert.match(insuranceConsole, /workspace-shell admin-workspace-shell/);
  assert.match(insuranceConsole, /workspace-summary-strip/);
  assert.match(insuranceInput, /workspace-section-card workspace-toolbar-card/);
  assert.match(insuranceSections, /workspace-section-card workspace-note-card/);

  assert.match(preflightConsole, /workspace-shell admin-workspace-shell/);
  assert.match(preflightConsole, /workspace-summary-strip/);
  assert.match(preflightConsole, /workspace-toolbar-card/);
  assert.match(preflightConsole, /workspace-note-card/);
}

run();
console.log("e2e-wi1158-route-first-workspace-visual-wave-seventeen.test passed");
