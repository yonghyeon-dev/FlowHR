import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const payslipDerivedState = readUtf8("src", "app", "employee", "payslips", "use-payslip-derived-state.ts");
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0414-korean-runtime-fallback-guard-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipLocaleHelpers, /function normalizeLocaleErrorMessage\(/);
  assert.match(payslipLocaleHelpers, /요청 처리 중 오류가 발생했습니다\./);
  assert.match(payslipLocaleHelpers, /return normalizeLocaleErrorMessage\(body, koLocale\);/);
  assert.match(payslipLocaleHelpers, /return normalizeLocaleErrorMessage\(JSON\.stringify\(body\), koLocale\);/);

  assert.match(payslipDerivedState, /function resolveDeductionFallbackLabel\(/);
  assert.match(payslipDerivedState, /기타 공제 항목/);
  assert.match(payslipDerivedState, /기타 세액공제 항목/);
  assert.doesNotMatch(payslipDerivedState, /label: mapped\?\.label \?\? key,/);
  assert.match(
    payslipDerivedState,
    /label: mapped\?\.label \?\? resolveDeductionFallbackLabel\(key, isKoLocale, "component"\),/
  );
  assert.match(
    payslipDerivedState,
    /label: mapped\?\.label \?\? resolveDeductionFallbackLabel\(key, isKoLocale, "tax-credit"\),/
  );

  assert.match(contractsHttp, /function shouldSuppressRawEnglishMessage\(/);
  assert.match(contractsHttp, /const koRuntime = isKoRuntimeLocale\(\);/);
  assert.match(
    contractsHttp,
    /const message = shouldSuppressRawEnglishMessage\(rawMessage, koRuntime\)/
  );

  assert.match(withholdingConsole, /unknownFormatLabel: string;/);
  assert.match(withholdingConsole, /unknownContentTypeLabel: string;/);
  assert.match(withholdingConsole, /unknownFormatLabel: "알 수 없는 형식"/);
  assert.match(withholdingConsole, /unknownContentTypeLabel: "알 수 없는 타입"/);
  assert.match(withholdingConsole, /return copy\.unknownFormatLabel;/);
  assert.match(withholdingConsole, /return copy\.unknownContentTypeLabel;/);

  assert.match(workItem, /WI-0414/i);
  assert.match(workItem, /korean|fallback|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0414/i);
}

run()
  .then(() => {
    console.log("e2e-wi0414-korean-runtime-fallback-guard-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
