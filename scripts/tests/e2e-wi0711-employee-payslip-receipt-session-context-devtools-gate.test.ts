import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0711-employee-payslip-receipt-session-context-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipReceiptConsole, /const showDevTools = isDevToolsEnabled\(\)/);
  assert.match(
    payslipReceiptConsole,
    /showDevTools \? \(\s*<p className="small muted">\s*\{copy\.sessionOrganizationLabel\}:[\s\S]*\{copy\.sessionEmployeeLabel\}/
  );

  assert.match(workItem, /WI-0711/i);
  assert.match(workItem, /payslip|receipt|session|devtools|employee/i);
  assert.match(roadmap, /WI-0711/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0711-employee-payslip-receipt-session-context-devtools-gate.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
