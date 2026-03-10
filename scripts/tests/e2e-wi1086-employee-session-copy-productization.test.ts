import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

const productLanguageSource = readUtf8("src", "lib", "product-language.ts");
const withholdingInputSource = readUtf8(
  "src",
  "components",
  "withholding-receipt",
  "WithholdingReceiptInputPanel.tsx"
);
const withholdingCopySource = readUtf8(
  "src",
  "components",
  "withholding-receipt",
  "copy-runtime.ts"
);
const payslipReceiptSource = readUtf8(
  "src",
  "components",
  "payslip-receipts",
  "PayslipReceiptConsole.tsx"
);
const payslipReceiptCopySource = readUtf8(
  "src",
  "components",
  "payslip-receipts",
  "copy.ts"
);
const payslipFilterPanelSource = readUtf8(
  "src",
  "app",
  "employee",
  "payslips",
  "page-view-filter-panel.tsx"
);
const payslipPageCopySource = readUtf8(
  "src",
  "app",
  "employee",
  "payslips",
  "page-locale-page-copy.ts"
);
const workItem = readUtf8("work-items", "WI-1086-employee-session-copy-productization.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(productLanguageSource, /formatSignedInAccountLabel/);

for (const source of [withholdingInputSource, payslipReceiptSource, payslipFilterPanelSource]) {
  assert.match(source, /formatWorkspaceConnectionState\(/);
  assert.match(source, /formatEmployeeSessionConnectionState\(/);
}

assert.match(payslipFilterPanelSource, /formatSignedInAccountLabel\(/);
assert.match(payslipFilterPanelSource, /formatActorRoleLabel\(/);

assert.doesNotMatch(withholdingInputSource, /<code>\{sessionOrganizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(withholdingInputSource, /<code>\{sessionEmployeeId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipReceiptSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipReceiptSource, /<code>\{employeeId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipFilterPanelSource, /<code>\{organizationId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipFilterPanelSource, /<code>\{employeeId \|\| "-"\}<\/code>/);
assert.doesNotMatch(payslipFilterPanelSource, /supabaseSession\.organizationId \?\? "-"/);
assert.doesNotMatch(payslipFilterPanelSource, /supabaseSession\.actorId \?\? "-"/);
assert.doesNotMatch(payslipFilterPanelSource, /supabaseSession\.email \?\? supabaseSession\.userId/);

assert.match(withholdingCopySource, /sessionOrganizationLabel:\s*"작업 공간 상태"/);
assert.match(withholdingCopySource, /sessionEmployeeLabel:\s*"직원 세션 상태"/);
assert.match(payslipReceiptCopySource, /sessionOrganizationLabel:\s*"작업 공간 상태"/);
assert.match(payslipReceiptCopySource, /sessionEmployeeLabel:\s*"직원 세션 상태"/);
assert.match(payslipPageCopySource, /sessionOrganizationLabel:\s*"작업 공간 상태"/);
assert.match(payslipPageCopySource, /sessionActorLabel:\s*"직원 세션 상태"/);

assert.match(workItem, /WI-1086/i);
assert.match(progress, /WI-1086/i);
assert.match(gapInventory, /WI-1086/i);

console.log("e2e-wi1086-employee-session-copy-productization.test passed");
