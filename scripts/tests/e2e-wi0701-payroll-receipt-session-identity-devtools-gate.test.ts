import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const withholdingInputPanel = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptInputPanel.tsx"
  );

  const insuranceConsole = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const insuranceInputPanel = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementInputPanel.tsx"
  );

  const workItem = readUtf8(
    "work-items",
    "WI-0701-payroll-receipt-session-identity-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(withholdingConsole, /showDevTools=\{showDevTools\}/);
  assert.match(withholdingInputPanel, /showDevTools: boolean;/);
  assert.match(withholdingInputPanel, /\{showDevTools \? \([\s\S]*copy\.sessionOrganizationLabel/);

  assert.match(insuranceConsole, /showDevTools=\{showDevTools\}/);
  assert.match(insuranceInputPanel, /showDevTools: boolean;/);
  assert.match(insuranceInputPanel, /\{showDevTools \? \([\s\S]*Session organization/);

  assert.match(workItem, /WI-0701/i);
  assert.match(workItem, /payroll|withholding|session|identity|devtools/i);
  assert.match(roadmap, /WI-0701/i);
}

run()
  .then(() => {
    console.log("e2e-wi0701-payroll-receipt-session-identity-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
