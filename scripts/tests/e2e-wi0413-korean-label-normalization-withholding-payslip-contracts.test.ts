import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipLocale = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0413-korean-label-normalization-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipLocale, /apiCalls:\s*"요청 호출"/);
  assert.match(payslipLocale, /downloadCsv:\s*"표 내려받기"/);
  assert.match(payslipLocale, /latestApi:\s*"최근 요청 상태"/);
  assert.match(payslipLocale, /printSavePdf:\s*"인쇄\/문서 저장"/);
  assert.match(payslipLocale, /copyPdfFileName:\s*"문서 파일명 복사"/);
  assert.match(payslipLocale, /deductionBreakdownRaw:\s*"공제 원본\(구조 데이터\)"/);

  assert.match(
    withholdingConsole,
    /const resolveDocumentFormatLabel = \(format: "json" \| "text"( \| string)?\) =>/
  );
  assert.match(withholdingConsole, /const resolveContentTypeLabel = \(contentType: string\) =>/);
  assert.match(withholdingConsole, /if \(lowered === "application\/json"\)\s*\{\s*return "구조 데이터";/);
  assert.match(withholdingConsole, /if \(lowered === "text\/plain"\)\s*\{\s*return "텍스트 데이터";/);
  assert.match(withholdingConsole, /resolveDocumentFormatLabel\(receiptDocument\.document\.format\)/);
  assert.match(withholdingConsole, /resolveContentTypeLabel\(receiptDocument\.document\.contentType\)/);

  assert.match(contractsCopy, /title:\s*"전자계약 워크스페이스"/);
  assert.match(contractsCopy, /title:\s*"내 계약함"/);
  assert.match(contractsCopy, /templateLibraryTitle:\s*"계약 템플릿 라이브러리"/);

  assert.match(workItem, /WI-0413/i);
  assert.match(workItem, /korean|label|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0413/i);
}

run()
  .then(() => {
    console.log("e2e-wi0413-korean-label-normalization-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
