import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const withholdingConsole = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptConsole.tsx");
  const withholdingInputPanel = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptInputPanel.tsx");
  const withholdingCopy = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");

  const payslipReceiptConsole = readUtf8("src", "components", "payslip-receipts", "PayslipReceiptConsole.tsx");
  const payslipReceiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0627-employee-tax-receipt-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(withholdingConsole, /useStickyStringState/);
  assert.doesNotMatch(withholdingConsole, /const \[accessToken/);
  assert.match(withholdingConsole, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(withholdingConsole, /const showDevTools = isDevToolsEnabled\(\)/);
  assert.match(withholdingConsole, /\{showDevTools \? \(/);

  assert.doesNotMatch(withholdingInputPanel, /onAccessTokenChange/);
  assert.doesNotMatch(withholdingInputPanel, /onOrganizationIdChange/);
  assert.doesNotMatch(withholdingInputPanel, /onEmployeeIdChange/);
  assert.match(withholdingInputPanel, /sessionOrganizationId/);
  assert.match(withholdingInputPanel, /sessionEmployeeId/);

  assert.match(withholdingCopy, /sessionOrganizationLabel/);
  assert.match(withholdingCopy, /sessionEmployeeLabel/);

  assert.doesNotMatch(payslipReceiptConsole, /useStickyStringState/);
  assert.doesNotMatch(payslipReceiptConsole, /const \[accessToken/);
  assert.match(payslipReceiptConsole, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(payslipReceiptConsole, /const showDevTools = isDevToolsEnabled\(\)/);
  assert.match(payslipReceiptConsole, /\{showDevTools \? \(/);
  assert.doesNotMatch(payslipReceiptConsole, /copy\.accessTokenLabel/);
  assert.doesNotMatch(payslipReceiptConsole, /copy\.organizationIdFallbackLabel/);

  assert.match(payslipReceiptCopy, /sessionOrganizationLabel/);
  assert.match(payslipReceiptCopy, /sessionEmployeeLabel/);

  assert.match(workItem, /WI-0627/i);
  assert.match(roadmap, /WI-0627/i);
}

run()
  .then(() => {
    console.log("e2e-wi0627-employee-tax-receipt-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
