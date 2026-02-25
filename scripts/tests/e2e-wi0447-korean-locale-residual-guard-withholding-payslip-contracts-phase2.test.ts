import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function extractKoBlock(source: string, pattern: RegExp, label: string) {
  const match = source.match(pattern);
  assert.ok(match, `ko block missing: ${label}`);
  return match?.[1] ?? "";
}

function extractStringLiterals(block: string) {
  const values: string[] = [];
  const regex = /:\s*"((?:\\"|[^"])*)"/g;
  let match = regex.exec(block);
  while (match) {
    values.push(match[1]);
    match = regex.exec(block);
  }
  return values;
}

function assertNoForbiddenEnglishTerms(values: string[], label: string) {
  const forbidden = [
    /\bEmployee ID\b/i,
    /\bOrganization ID\b/i,
    /\bPending\b/i,
    /\bFailed\b/i,
    /\bSearch\b/i,
    /\bSort\b/i,
    /\bPreview\b/i,
    /\bReceipt\b/i,
    /\bContract\b/i,
    /\bDownload\b/i,
    /\bLoad\b/i
  ];
  const violations = values.filter((value) => forbidden.some((pattern) => pattern.test(value)));
  assert.equal(
    violations.length,
    0,
    `${label} ko copy includes forbidden English literals: ${violations.join(" | ")}`
  );
}

async function run() {
  const withholdingCopy = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const payslipReceiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const contractsJourneyCopy = readUtf8("src", "components", "contracts", "journey-copy.ts");
  const payslipSearchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const payslipPageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0447-korean-locale-residual-guard-phase2-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const withholdingKoValues = extractStringLiterals(
    extractKoBlock(withholdingCopy, /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/, "withholding"),
  );
  const payslipReceiptKoValues = extractStringLiterals(
    extractKoBlock(payslipReceiptCopy, /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/, "payslip receipts"),
  );
  const contractsJourneyKoValues = extractStringLiterals(
    extractKoBlock(contractsJourneyCopy, /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/, "contracts journey"),
  );
  const payslipSearchSortKoValues = extractStringLiterals(
    extractKoBlock(
      payslipSearchSortCopy,
      /resolvePayslipSearchSortCopy\(isKoLocale: boolean\)\s*:\s*PayslipSearchSortCopy\s*\{[\s\S]*?if \(isKoLocale\)\s*\{\s*return \{([\s\S]*?)\r?\n\s*\};/,
      "payslip search/sort"
    )
  );
  const payslipPageKoValues = extractStringLiterals(
    extractKoBlock(
      payslipPageCopy,
      /resolvePayslipPageCopy\(isKoLocale: boolean\)\s*:\s*PayslipPageCopy\s*\{[\s\S]*?if \(isKoLocale\)\s*\{\s*return \{([\s\S]*?)\r?\n\s*\};/,
      "payslip page"
    )
  );

  assertNoForbiddenEnglishTerms(withholdingKoValues, "withholding");
  assertNoForbiddenEnglishTerms(payslipReceiptKoValues, "payslip receipts");
  assertNoForbiddenEnglishTerms(contractsJourneyKoValues, "contracts journey");
  assertNoForbiddenEnglishTerms(payslipSearchSortKoValues, "payslip search/sort");
  assertNoForbiddenEnglishTerms(payslipPageKoValues, "payslip page");

  assert.match(workItem, /WI-0447/i);
  assert.match(workItem, /korean|locale|residual|guard/i);
  assert.match(roadmap, /WI-0447/i);
}

run()
  .then(() => {
    console.log("e2e-wi0447-korean-locale-residual-guard-withholding-payslip-contracts-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
