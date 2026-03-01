import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePayslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0707-employee-payslip-session-identity-devtools-gate-completion.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeePayslipFilterPanel,
    /\{showDevTools \? \(\s*<p className="small muted">[\s\S]*organizationIdOptional[\s\S]*filters\.employeeId[\s\S]*\) : null\}/
  );

  assert.match(
    payslipReceiptConsole,
    /\{showDevTools \? \(\s*<p className="small muted">[\s\S]*sessionOrganizationLabel[\s\S]*sessionEmployeeLabel[\s\S]*\) : null\}/
  );

  assert.match(workItem, /WI-0707/i);
  assert.match(workItem, /payslip|receipt|session|identity|devtools/i);
  assert.match(roadmap, /WI-0707/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0707-employee-payslip-session-identity-devtools-gate-completion.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
