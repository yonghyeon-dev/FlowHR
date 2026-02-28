import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const withholdingCopyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const contractsRuntimeCopy = readUtf8("src", "components", "contracts", "runtime-copy-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0640-korean-surface-copy-completion-for-tax-receipt-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPageCopy, /organizationIdOptional: "로그인 조직"/);
  assert.match(payslipPageCopy, /employeeId: "로그인 직원"/);
  assert.match(payslipPageCopy, /downloadCsv: "목록 내보내기"/);
  assert.match(payslipPageCopy, /apiCalls: "요청 건수"/);

  assert.match(payslipPage, /const header = isKoLocale/);
  assert.match(payslipPage, /"명세서_번호"/);
  assert.match(payslipPage, /"실수령_원"/);

  assert.match(withholdingCopyRuntime, /metadataReceiptNumberLabel: "영수증 번호"/);
  assert.match(withholdingCopyRuntime, /metadataContentTypeLabel: "콘텐츠 타입"/);
  assert.match(withholdingCopyRuntime, /metadataContentSha256Label: "콘텐츠 해시값"/);
  assert.match(withholdingConsole, /copy\.metadataReceiptNumberLabel/);
  assert.match(withholdingConsole, /copy\.metadataContentTypeLabel/);
  assert.doesNotMatch(withholdingConsole, /receiptNumber=/);
  assert.doesNotMatch(withholdingConsole, /contentSha256=/);

  assert.match(contractsRuntimeCopy, /\\baddendum\\b/);
  assert.match(contractsRuntimeCopy, /\\boffer\\b/);
  assert.match(contractsRuntimeCopy, /\\bagreement\\b/);

  assert.match(workItem, /WI-0640/i);
  assert.match(roadmap, /WI-0640/i);
}

run()
  .then(() => {
    console.log("e2e-wi0640-korean-surface-copy-completion-for-tax-receipt-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
