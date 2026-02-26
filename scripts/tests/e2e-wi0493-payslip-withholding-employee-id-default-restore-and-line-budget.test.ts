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
  const payslipConsole = readUtf8("src", "components", "payslip-receipts", "PayslipReceiptConsole.tsx");
  const payslipHelpers = readUtf8("src", "components", "payslip-receipts", "request-helpers.ts");
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
  const withholdingRequestHook = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "useWithholdingReceiptRequests.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0493-payslip-withholding-employee-id-default-restore-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(payslipConsole) <= 300,
    `PayslipReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(payslipConsole)})`
  );
  assert.ok(
    countLines(withholdingConsole) <= 300,
    `WithholdingReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(withholdingConsole)})`
  );

  for (const source of [payslipConsole, withholdingConsole]) {
    assert.match(source, /getLocalizedEmployeeIdInputDefault/);
    assert.match(source, /normalizeEmployeeIdForLocaleInput/);
    assert.match(source, /employeeId\.trim\(\)\.length === 0/);
    assert.match(source, /setEmployeeId\(localeEmployeeIdDefault\)/);
  }

  assert.match(payslipHelpers, /export function buildPayslipReceiptQuery/);
  assert.match(payslipHelpers, /export async function parsePayslipReceiptResponseBody/);

  assert.match(withholdingConsole, /WithholdingReceiptInputPanel/);
  assert.match(withholdingConsole, /useWithholdingReceiptRequests/);
  assert.match(withholdingInputPanel, /onEmployeeIdBlur/);
  assert.match(withholdingRequestHook, /const runRequest = useCallback\(/);
  assert.match(withholdingRequestHook, /function isErrorPayload\(value: unknown\)/);

  assert.match(workItem, /WI-0493/i);
  assert.match(workItem, /employee-id|line budget|default restore|withholding|payslip/i);
  assert.match(roadmap, /WI-0493/i);
}

run()
  .then(() => {
    console.log("e2e-wi0493-payslip-withholding-employee-id-default-restore-and-line-budget.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
