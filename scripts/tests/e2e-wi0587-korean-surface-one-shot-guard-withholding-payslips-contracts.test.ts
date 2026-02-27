import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function objectSectionByBrace(source: string, startToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing token: ${startToken}`);
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }
  throw new Error(`failed to close section for token: ${startToken}`);
}

async function run() {
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const withholdingCopyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const payslipPageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const payslipSearchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0587-korean-surface-one-shot-guard-withholding-payslips-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const contractsEmployeeAnchor = contractsCopy.indexOf("export const employeeContractsCopyByLocale");
  const contractsKo = objectSectionByBrace(contractsCopy, "ko: {", contractsEmployeeAnchor);
  assert.match(contractsKo, /inboxSearchLabel:\s*"받은함 검색"/);
  assert.match(contractsKo, /responseHistoryFilterLabel:\s*"이력 필터"/);
  assert.match(contractsKo, /responseHistoryVisibleCountLabel:\s*"표시 이력"/);
  assert.doesNotMatch(contractsKo, /inboxSearchLabel:\s*"[^"]*search/i);

  const withholdingKo = objectSectionByBrace(withholdingCopyRuntime, "ko: {");
  assert.match(withholdingKo, /actionDownloadLoadedDocument:\s*"불러온 문서 다운로드"/);
  assert.match(withholdingKo, /actionCopyDocumentMetadata:\s*"문서 메타데이터 복사"/);
  assert.match(withholdingKo, /documentPreviewHiddenNotice:\s*"문서 본문 미리보기는 다운로드에서 확인할 수 있습니다\."/);
  assert.doesNotMatch(withholdingKo, /actionDownloadLoadedDocument:\s*"Download/i);

  const payslipPageKo = objectSectionByBrace(payslipPageCopy, "return {", payslipPageCopy.indexOf("if (isKoLocale)"));
  assert.match(payslipPageKo, /ariaLabel:\s*"급여 명세서 목록"/);
  assert.match(payslipPageKo, /tableAriaLabel:\s*"명세서 비교 표"/);
  assert.match(payslipPageKo, /sheetAriaLabel:\s*"급여 명세서 문서 형식"/);
  assert.doesNotMatch(payslipPageKo, /ariaLabel:\s*"payslip/i);
  assert.doesNotMatch(payslipPageKo, /tableAriaLabel:\s*"payslip/i);
  assert.doesNotMatch(payslipPageKo, /sheetAriaLabel:\s*"payslip/i);

  const payslipSearchKo = objectSectionByBrace(
    payslipSearchSortCopy,
    "return {",
    payslipSearchSortCopy.indexOf("if (isKoLocale)")
  );
  assert.match(payslipSearchKo, /listAriaLabel:\s*"명세서 검색\/정렬 목록"/);
  assert.doesNotMatch(payslipSearchKo, /listAriaLabel:\s*"payslip/i);

  assert.match(workItem, /WI-0587/i);
  assert.match(workItem, /korean|one-shot|guard|withholding|payslip|contract/i);
  assert.match(roadmap, /WI-0587/i);
}

run()
  .then(() => {
    console.log("e2e-wi0587-korean-surface-one-shot-guard-withholding-payslips-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
