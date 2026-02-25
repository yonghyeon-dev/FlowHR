import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
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

function extractKoBlocks(source: string, pattern: RegExp, label: string) {
  const values: string[] = [];
  let match = pattern.exec(source);
  while (match) {
    values.push(...extractStringLiterals(match[1] ?? ""));
    match = pattern.exec(source);
  }
  assert.ok(values.length > 0, `ko block values missing: ${label}`);
  return values;
}

function assertNoUnexpectedLatin(values: string[], label: string) {
  const allowTokens = new Set(["FlowHR"]);
  const violations = values.flatMap((value) => {
    const tokens = value.match(/[A-Za-z][A-Za-z0-9-]*/g) ?? [];
    const unexpected = tokens.filter((token) => {
      if (allowTokens.has(token)) {
        return false;
      }
      // Ignore escaped unicode artifacts (e.g. \uBA85 -> tokenized as uBA85).
      if (/^u[0-9A-Fa-f]{4,}$/.test(token)) {
        return false;
      }
      return true;
    });
    if (unexpected.length === 0) {
      return [];
    }
    return [`${value} => ${unexpected.join(",")}`];
  });
  assert.equal(
    violations.length,
    0,
    `${label} has unexpected Latin tokens in ko copy: ${violations.join(" | ")}`
  );
}

async function run() {
  const withholdingCopy = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const payslipReceiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
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
    "WI-0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const withholdingKoValues = extractKoBlocks(
    withholdingCopy,
    /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/g,
    "withholding"
  );
  const payslipReceiptKoValues = extractKoBlocks(
    payslipReceiptCopy,
    /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/g,
    "payslip receipt"
  );
  const contractsKoValues = extractKoBlocks(
    contractsCopy,
    /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/g,
    "contracts"
  );
  const contractsJourneyKoValues = extractKoBlocks(
    contractsJourneyCopy,
    /ko:\s*\{([\s\S]*?)\r?\n\s*\},\r?\n\s*en:/g,
    "contracts journey"
  );
  const payslipSearchSortKoValues = extractKoBlocks(
    payslipSearchSortCopy,
    /if \(isKoLocale\)\s*\{\s*return \{([\s\S]*?)\r?\n\s*\};/g,
    "payslip search/sort"
  );
  const payslipPageKoValues = extractKoBlocks(
    payslipPageCopy,
    /if \(isKoLocale\)\s*\{\s*return \{([\s\S]*?)\r?\n\s*\};/g,
    "payslip page"
  );

  assertNoUnexpectedLatin(withholdingKoValues, "withholding");
  assertNoUnexpectedLatin(payslipReceiptKoValues, "payslip receipt");
  assertNoUnexpectedLatin(contractsKoValues, "contracts");
  assertNoUnexpectedLatin(contractsJourneyKoValues, "contracts journey");
  assertNoUnexpectedLatin(payslipSearchSortKoValues, "payslip search/sort");
  assertNoUnexpectedLatin(payslipPageKoValues, "payslip page");

  assert.match(workItem, /WI-0448/i);
  assert.match(workItem, /korean|locale|latin|sweep|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0448/i);
}

run()
  .then(() => {
    console.log("e2e-wi0448-korean-locale-static-latin-sweep-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
