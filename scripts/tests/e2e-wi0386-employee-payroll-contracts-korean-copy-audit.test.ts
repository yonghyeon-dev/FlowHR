import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function section(source: string, startToken: string, endToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing start token: ${startToken}`);
  const end = source.indexOf(endToken, start);
  assert.ok(end >= 0, `missing end token: ${endToken}`);
  return source.slice(start, end);
}

function objectSectionByBrace(source: string, startToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing start token: ${startToken}`);
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
  throw new Error(`failed to close object section for token: ${startToken}`);
}

async function run() {
  const withholdingSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const payslipReceiptCopySource = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "copy.ts"
  );
  const payslipLocaleSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-helpers.ts"
  );
  const payslipPageSource = readFileSync(
    join(process.cwd(), "src", "app", "employee", "payslips", "page.tsx")
  ).toString("latin1");
  const payslipPageViewSource = readFileSync(
    join(process.cwd(), "src", "app", "employee", "payslips", "page-view.tsx")
  ).toString("latin1");
  const contractsCopySource = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0386-employee-payroll-contracts-korean-copy-audit.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const withholdingKoBlock = section(withholdingSource, "ko: {", "  en: {");
  assert.doesNotMatch(withholdingKoBlock, /dev fallback|Bearer token|\bRun\b|\bID\b|SHA256/);
  assert.match(
    withholdingKoBlock,
    /organizationIdFallbackLabel:\s*"조직 식별자\(개발 대체값\)"/
  );
  assert.match(withholdingKoBlock, /formatJsonLabel:\s*"구조 데이터"/);
  assert.match(withholdingKoBlock, /contentSha256Label:\s*"콘텐츠 해시값"/);
  assert.match(withholdingSource, /placeholder=\{copy\.bearerTokenPlaceholder\}/);
  assert.match(withholdingSource, /<option value="json">\{copy\.formatJsonLabel\}<\/option>/);
  assert.match(withholdingSource, /<option value="text">\{copy\.formatTextLabel\}<\/option>/);
  assert.match(
    withholdingSource,
    /locale === "ko" \? "ko-KR" : "en-US"[\s\S]*locale === "ko" \? "원" : " KRW"/
  );
  assert.doesNotMatch(withholdingSource, /placeholder="Bearer token"/);
  assert.doesNotMatch(withholdingSource, /<option value="json">json<\/option>/);
  assert.doesNotMatch(withholdingSource, /<option value="text">text<\/option>/);

  const payslipReceiptKoBlock = section(payslipReceiptCopySource, "ko: {", "  en: {");
  assert.doesNotMatch(payslipReceiptKoBlock, /dev fallback|Bearer|\bRun\b|\bID\b/);
  assert.match(payslipReceiptKoBlock, /organizationIdFallbackLabel:\s*"조직 식별자\(개발 대체값\)"/);
  assert.match(payslipReceiptKoBlock, /totalConfirmedRunsLabel:\s*"확정 실행 수"/);
  assert.match(payslipReceiptKoBlock, /runsTitle:\s*"실행 목록"/);
  assert.match(payslipReceiptKoBlock, /receiptAlreadyConfirmedPrefix:\s*"이미 수신 확인된 실행"/);
  assert.match(payslipReceiptKoBlock, /receiptConfirmedPrefix:\s*"수신 확인 완료 실행"/);

  const payslipPageCopyAnchor = payslipLocaleSource.indexOf(
    "export function resolvePayslipPageCopy(isKoLocale: boolean)"
  );
  assert.ok(payslipPageCopyAnchor >= 0, "missing resolvePayslipPageCopy");
  const payslipLocaleKoAnchor = payslipLocaleSource.indexOf(
    "if (isKoLocale) {",
    payslipPageCopyAnchor
  );
  assert.ok(payslipLocaleKoAnchor >= 0, "missing payslip ko locale branch");
  const payslipLocaleKoBlock = objectSectionByBrace(
    payslipLocaleSource,
    "return {",
    payslipLocaleKoAnchor
  );
  assert.doesNotMatch(
    payslipLocaleKoBlock,
    /"run id"|,\s*confirmed,|Bearer\)|"OK"|"FAIL"|"ON"|"OFF"|조직 ID|직원 ID|명세서 ID/
  );
  assert.match(
    payslipLocaleSource,
    /description:\s*"실행 번호\/기간\/상태 조건으로 확정 명세서를 빠르게 찾고 정렬합니다\."/
  );
  assert.match(payslipLocaleSource, /runId:\s*"실행 번호"/);
  assert.match(payslipLocaleKoBlock, /bearerStatusLabel:\s*"토큰 모드"/);
  assert.match(payslipPageViewSource, /\(\{pageCopy\.devTools\.bearerStatusLabel\}/);
  assert.doesNotMatch(
    payslipPageViewSource,
    /\(Bearer \{usesBearerToken \? pageCopy\.devTools\.bearerOn : pageCopy\.devTools\.bearerOff\}\)/
  );

  const employeeContractsAnchor = contractsCopySource.indexOf(
    "export const employeeContractsCopyByLocale"
  );
  assert.ok(employeeContractsAnchor >= 0, "missing employee contracts locale copy");
  const contractsKoBlock = section(
    contractsCopySource,
    "ko: {",
    "  en: employeeContractsCopyEn",
    employeeContractsAnchor
  );
  assert.doesNotMatch(
    contractsKoBlock,
    /employee contract inbox|selected employee contract detail|Load Evidence JSON|Load Evidence Text|SHA256/
  );
  assert.match(contractsKoBlock, /inboxAria:\s*"직원 계약 받은함 목록"/);
  assert.match(contractsKoBlock, /detailAria:\s*"선택한 직원 계약 상세"/);
  assert.match(contractsKoBlock, /idLabel:\s*"문서 번호"/);
  assert.match(contractsKoBlock, /loadEvidenceJsonAction:\s*"증빙 구조 데이터 불러오기"/);
  assert.match(contractsKoBlock, /loadEvidenceTextAction:\s*"증빙 텍스트 불러오기"/);
  assert.match(contractsKoBlock, /contentShaLabel:\s*"콘텐츠 해시값"/);

  assert.match(workItem, /WI-0386/i);
  assert.match(workItem, /원천징수|명세서|계약함/);
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
