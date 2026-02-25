import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const contractsRuntimeCopyHelpers = readUtf8(
    "src",
    "components",
    "contracts",
    "runtime-copy-helpers.ts"
  );
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const contractsInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const payslipReceiptRuntimeHelpers = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0429-korean-runtime-message-and-contract-title-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(contractsRuntimeCopyHelpers, /const contractEnglishKeywordPatterns = \[/);
  assert.match(contractsRuntimeCopyHelpers, /function shouldNormalizeAsKoFallbackTitle\(/);
  assert.match(contractsRuntimeCopyHelpers, /return asciiRatio >= 0\.25;/);
  assert.match(contractsRuntimeCopyHelpers, /return `계약서 \$\{stableId\.slice\(0, 8\)\}`;/);

  assert.match(contractsHttp, /const koContractsErrorMessagePatterns: Array<\{ pattern: RegExp; message: string \}> = \[/);
  assert.match(contractsHttp, /function resolveKnownKoContractsErrorMessage\(/);
  assert.match(contractsHttp, /signature\\s\*input.*required/i);
  assert.match(contractsHttp, /요청이 실패했습니다\. 잠시 후 다시 시도해 주세요\./);
  assert.match(contractsHttp, /const knownKoMessage = resolveKnownKoContractsErrorMessage\(normalized\);/);

  assert.match(contractsInbox, /setMessage\(isKoLocale \? copy\.evidenceLoadedPrefix : `\$\{copy\.evidenceLoadedPrefix\}: \$\{body\.evidence\.fileName\}`\);/);

  assert.match(payslipLocaleHelpers, /const koRuntimeErrorMessagePatterns: Array<\{ pattern: RegExp; message: string \}> = \[/);
  assert.match(payslipLocaleHelpers, /resolveKnownKoRuntimeErrorMessage/);
  assert.match(payslipLocaleHelpers, /요청이 실패했습니다\. 잠시 후 다시 시도해 주세요\./);

  assert.match(payslipReceiptRuntimeHelpers, /const koRuntimeMessagePatterns: Array<\{ pattern: RegExp; message: string \}> = \[/);
  assert.match(payslipReceiptRuntimeHelpers, /resolveKnownKoRuntimeMessage/);
  assert.match(payslipReceiptRuntimeHelpers, /직원 번호는 필수입니다\./);

  assert.match(withholdingConsole, /const koRuntimeDiagnosticPatterns: Array<\{ pattern: RegExp; message: string \}> = \[/);
  assert.match(withholdingConsole, /resolveKnownKoRuntimeDiagnosticMessage/);
  assert.match(withholdingConsole, /인증 세션이 유효하지 않습니다\. 다시 로그인해 주세요\./);

  assert.match(workItem, /WI-0429/i);
  assert.match(workItem, /korean|runtime|contracts|payslip|withholding/i);
  assert.match(roadmap, /WI-0429/i);
}

run()
  .then(() => {
    console.log("e2e-wi0429-korean-runtime-message-and-contract-title-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
