import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipReceiptRuntimeHelpers = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const payslipReceiptConsole = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const withholdingCopyRuntime = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");

  const workItem = readUtf8(
    "work-items",
    "WI-0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipReceiptRuntimeHelpers, /export function normalizePayslipReceiptRuntimeMessage\(/);
  assert.match(payslipReceiptRuntimeHelpers, /if \(locale !== "ko"\)/);
  assert.match(payslipReceiptRuntimeHelpers, /return koFallback;/);

  assert.match(payslipReceiptConsole, /normalizePayslipReceiptRuntimeMessage/);
  assert.match(payslipReceiptConsole, /const normalizedSupabaseSessionError = useMemo\(/);
  assert.match(payslipReceiptConsole, /copy\.sessionErrorPrefix\}: \{normalizedSupabaseSessionError\}/);

  assert.match(withholdingCopyRuntime, /actionPreviewReceipt:\s*"영수증 미리보기"/);
  assert.match(withholdingCopyRuntime, /pendingReceiptPreview:\s*"원천징수영수증 미리보기"/);
  assert.match(withholdingCopyRuntime, /logPreviewReceipt:\s*"원천징수영수증 미리보기"/);
  assert.match(withholdingCopyRuntime, /runGuardPreviewedLabel:\s*"미리보기"/);

  assert.match(contractsCopy, /commentLabel:\s*"의견"/);

  assert.match(workItem, /WI-0427/i);
  assert.match(workItem, /korean|runtime|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0427/i);
}

run()
  .then(() => {
    console.log("e2e-wi0427-korean-runtime-residual-hardening-withholding-payslip-receipts-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
