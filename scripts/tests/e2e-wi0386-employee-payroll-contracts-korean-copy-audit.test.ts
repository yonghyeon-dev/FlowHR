import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function extractKoBlockByAnchor(source: string, anchor: string) {
  const anchorIndex = source.indexOf(anchor);
  assert.ok(anchorIndex >= 0, `missing anchor: ${anchor}`);
  const scoped = source.slice(anchorIndex);
  const match = scoped.match(/ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/);
  assert.ok(match, `missing ko block near anchor: ${anchor}`);
  return match[1] ?? "";
}

async function run() {
  const withholdingCopyRuntime = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const payslipReceiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const payslipLocaleCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-copy.ts");
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0386-employee-payroll-contracts-korean-copy-audit.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const withholdingKoBlock = extractKoBlockByAnchor(
    withholdingCopyRuntime,
    "export const withholdingReceiptCopyByLocale"
  );
  assert.match(withholdingKoBlock, /organizationIdFallbackLabel:\s*"/);
  assert.match(withholdingKoBlock, /formatJsonLabel:\s*"/);
  assert.match(withholdingKoBlock, /contentSha256Label:\s*"/);
  assert.doesNotMatch(withholdingKoBlock, /Organization ID \(dev fallback\)|Bearer token|Content SHA256/);

  assert.match(withholdingConsole, /placeholder=\{copy\.bearerTokenPlaceholder\}/);
  assert.match(withholdingConsole, /<option value="json">\{copy\.formatJsonLabel\}<\/option>/);
  assert.match(withholdingConsole, /<option value="text">\{copy\.formatTextLabel\}<\/option>/);
  assert.doesNotMatch(withholdingConsole, /placeholder="Bearer token"/);
  assert.doesNotMatch(withholdingConsole, /<option value="json">\s*json\s*<\/option>/i);
  assert.doesNotMatch(withholdingConsole, /<option value="text">\s*text\s*<\/option>/i);

  const payslipReceiptKoBlock = extractKoBlockByAnchor(
    payslipReceiptCopy,
    "export const payslipReceiptCopyByLocale"
  );
  assert.match(payslipReceiptKoBlock, /organizationIdFallbackLabel:\s*"/);
  assert.match(payslipReceiptKoBlock, /totalConfirmedRunsLabel:\s*"/);
  assert.match(payslipReceiptKoBlock, /runsTitle:\s*"/);
  assert.match(payslipReceiptKoBlock, /receiptAlreadyConfirmedPrefix:\s*"/);
  assert.match(payslipReceiptKoBlock, /receiptConfirmedPrefix:\s*"/);
  assert.doesNotMatch(
    payslipReceiptKoBlock,
    /Organization ID \(dev fallback\)|receipt confirmed|receipt already confirmed/i
  );
  assert.match(payslipReceiptConsole, /placeholder=\{copy\.bearerTokenPlaceholder\}/);
  assert.doesNotMatch(payslipReceiptConsole, /placeholder="Bearer token"/);

  assert.match(payslipLocaleCopy, /resolvePayslipPageCopy/);
  assert.match(payslipLocaleCopy, /resolvePayslipSearchSortCopy/);
  assert.match(payslipFilterPanel, /\(\{pageCopy\.devTools\.bearerStatusLabel\}/);
  assert.doesNotMatch(
    payslipFilterPanel,
    /\(Bearer \{usesBearerToken \? pageCopy\.devTools\.bearerOn : pageCopy\.devTools\.bearerOff\}\)/
  );

  const contractsKoBlock = extractKoBlockByAnchor(
    contractsCopy,
    "export const employeeContractsCopyByLocale"
  );
  assert.match(contractsKoBlock, /inboxAria:\s*"/);
  assert.match(contractsKoBlock, /detailAria:\s*"/);
  assert.match(contractsKoBlock, /idLabel:\s*"/);
  assert.match(contractsKoBlock, /loadEvidenceJsonAction:\s*"/);
  assert.match(contractsKoBlock, /loadEvidenceTextAction:\s*"/);
  assert.match(contractsKoBlock, /contentShaLabel:\s*"/);
  assert.doesNotMatch(
    contractsKoBlock,
    /employee contract inbox|selected employee contract detail|Load Evidence JSON|Load Evidence Text|SHA256/
  );

  assert.match(workItem, /WI-0386/i);
  assert.match(workItem, /korean|withholding|payslip|contracts|copy/i);
  assert.match(roadmap, /WI-0386/i);
}

run()
  .then(() => {
    console.log("e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
