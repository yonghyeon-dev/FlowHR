import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollCloseConsole = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const payslipDeliveryConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const insuranceInputPanel = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementInputPanel.tsx"
  );
  const insuranceConsole = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0715-payroll-session-context-strict-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollCloseConsole, /showDevTools \? \(\s*<p className="small muted">/);
  assert.match(payslipDeliveryConsole, /showDevTools \? \(\s*<p className="small muted">/);

  assert.match(insuranceInputPanel, /showDevTools: boolean;/);
  assert.match(insuranceInputPanel, /\{showDevTools \? \(\s*<p className="small">/);
  assert.match(insuranceConsole, /showDevTools=\{showDevTools\}/);

  assert.match(workItem, /WI-0715/i);
  assert.match(workItem, /payroll|session|devtools|close|delivery|insurance/i);
  assert.match(roadmap, /WI-0715/i);
}

run()
  .then(() => {
    console.log("e2e-wi0715-payroll-session-context-strict-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
