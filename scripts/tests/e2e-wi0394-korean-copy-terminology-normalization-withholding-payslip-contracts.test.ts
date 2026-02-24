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
  const payslipReceiptCopySource = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const contractsCopySource = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0394-korean-copy-terminology-normalization-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const withholdingKo = section(withholdingSource, "ko: {", "  en: {");
  assert.match(
    withholdingSource,
    /function parseRequiredInt\(value: string, fieldName: string, locale: FlowLocale\)/
  );
  assert.match(withholdingSource, /`\$\{fieldName\}은\(는\) 0 이상의 정수여야 합니다`/);
  assert.match(withholdingKo, /employeeIdLabel:\s*"직원 번호"/);
  assert.match(withholdingKo, /organizationIdFallbackLabel:\s*"조직 식별자\(개발 대체값\)"/);
  assert.match(withholdingKo, /pendingReceiptRunsLabel:\s*"수신확인 대기 실행"/);
  assert.match(withholdingKo, /finalizationIdLabel:\s*"확정 번호"/);
  assert.match(withholdingKo, /runGuardSnapshotLabel:\s*"실행 가드 스냅샷"/);
  assert.match(withholdingKo, /contentSha256Label:\s*"콘텐츠 해시값"/);
  assert.doesNotMatch(withholdingKo, /직원 ID|조직 ID\(dev fallback\)|대기 Run|확정 ID|Run 가드 스냅샷|콘텐츠 SHA256/);

  const payslipKo = section(payslipReceiptCopySource, "ko: {", "  en: {");
  assert.match(payslipKo, /employeeIdLabel:\s*"직원 번호"/);
  assert.match(payslipKo, /organizationIdFallbackLabel:\s*"조직 식별자\(개발 대체값\)"/);
  assert.match(payslipKo, /totalConfirmedRunsLabel:\s*"확정 실행 수"/);
  assert.match(payslipKo, /runsTitle:\s*"실행 목록"/);
  assert.match(payslipKo, /receiptAlreadyConfirmedPrefix:\s*"이미 수신 확인된 실행"/);
  assert.match(payslipKo, /receiptConfirmedPrefix:\s*"수신 확인 완료 실행"/);
  assert.doesNotMatch(payslipKo, /직원 ID|조직 ID\(dev fallback\)|확정 Run 수|Run 목록|이미 수신 확인된 Run|수신 확인 완료 Run/);

  const adminContractsAnchor = contractsCopySource.indexOf("export const adminContractsCopyByLocale");
  assert.ok(adminContractsAnchor >= 0, "missing admin contracts locale copy");
  const adminContractsKo = objectSectionByBrace(contractsCopySource, "ko: {", adminContractsAnchor);
  assert.doesNotMatch(adminContractsKo, /\.\.\.adminContractsCopyEn/);

  const builderAnchor = contractsCopySource.indexOf("export const contractTemplateBuilderCopyByLocale");
  assert.ok(builderAnchor >= 0, "missing contract template builder locale copy");
  const builderKo = objectSectionByBrace(contractsCopySource, "ko: {", builderAnchor);
  assert.doesNotMatch(builderKo, /\.\.\.contractTemplateBuilderCopyEn/);

  const employeeContractsAnchor = contractsCopySource.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeContractsAnchor >= 0, "missing employee contracts locale copy");
  const employeeContractsKo = objectSectionByBrace(contractsCopySource, "ko: {", employeeContractsAnchor);
  assert.doesNotMatch(employeeContractsKo, /\.\.\.employeeContractsCopyEn/);
  assert.match(employeeContractsKo, /idLabel:\s*"문서 번호"/);
  assert.match(employeeContractsKo, /loadEvidenceJsonAction:\s*"증빙 구조 데이터 불러오기"/);
  assert.match(employeeContractsKo, /contentShaLabel:\s*"콘텐츠 해시값"/);

  assert.match(workItem, /WI-0394/i);
  assert.match(workItem, /원천징수|명세서|전자계약함/);
  assert.match(roadmap, /WI-0394/i);
}

run()
  .then(() => {
    console.log("e2e-wi0394-korean-copy-terminology-normalization-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
