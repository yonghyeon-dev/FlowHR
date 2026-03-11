import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8(
    "work-items",
    "WI-1160-employee-document-workspace-visual-wave-nineteen.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const employeeYearEndConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );

  assert.match(wi, /WI-1160/);
  assert.match(
    progress,
    /Closed `WI-1159` with merge `80704bc538df08fd74507d3caf8acfd8d15dc733`/
  );
  assert.match(progress, /Started `WI-1160`/);

  assert.match(payslipReceiptConsole, /workspace-shell employee-workspace-shell/);
  assert.match(payslipReceiptConsole, /workspace-summary-strip/);
  assert.match(payslipReceiptConsole, /workspace-toolbar-card/);
  assert.match(payslipReceiptConsole, /backToEmployeeHomeLabel/);

  assert.match(employeeYearEndConsole, /workspace-shell employee-workspace-shell/);
  assert.match(employeeYearEndConsole, /workspace-summary-strip/);
  assert.match(employeeYearEndConsole, /workspace-toolbar-card/);
  assert.match(employeeYearEndConsole, /backToEmployeeHomeLabel/);
}

run();
console.log("e2e-wi1160-employee-document-workspace-visual-wave-nineteen.test passed");
