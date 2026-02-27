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

function isAllowedKoAsciiToken(token: string) {
  return (
    /^FlowHR$/.test(token) ||
    /^EMP$/.test(token) ||
    /^EMP-\d+$/.test(token) ||
    /^u[0-9A-Fa-f]{4,}$/.test(token)
  );
}

function assertNoResidualEnglishTokens(values: string[], label: string) {
  const violations = values.flatMap((value) => {
    const tokens = value.match(/[A-Za-z][A-Za-z0-9-]*/g) ?? [];
    const disallowed = tokens.filter((token) => !isAllowedKoAsciiToken(token));
    if (disallowed.length === 0) {
      return [];
    }
    return [`${value} => ${disallowed.join(",")}`];
  });
  assert.equal(violations.length, 0, `${label} ko copy has residual English tokens: ${violations.join(" | ")}`);
}

function extractKoLocaleBlockByAnchor(source: string, anchorToken: string) {
  const anchor = source.indexOf(anchorToken);
  assert.ok(anchor >= 0, `missing anchor token: ${anchorToken}`);
  return objectSectionByBrace(source, "ko: {", anchor);
}

function extractKoReturnBlock(source: string) {
  const ifIndex = source.indexOf("if (isKoLocale)");
  assert.ok(ifIndex >= 0, "missing if (isKoLocale) block");
  return objectSectionByBrace(source, "return {", ifIndex);
}

async function run() {
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const templateChecklist = readUtf8(
    "src",
    "components",
    "contracts",
    "template-builder-checklist.tsx"
  );
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");

  const withholdingCopyRuntime = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const payslipPageCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-page-copy.ts"
  );
  const payslipSearchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");

  const workItem = readUtf8(
    "work-items",
    "WI-0579-korean-residual-one-shot-and-ci-guard.md"
  );
  const roadmap = readUtf8("ROADMAP.md");
  const codexGuide = readUtf8("docs", "codex-guide.md");

  const withholdingKo = extractKoLocaleBlockByAnchor(
    withholdingCopyRuntime,
    "export const withholdingReceiptCopyByLocale"
  );
  const payslipPageKo = extractKoReturnBlock(payslipPageCopy);
  const payslipSearchSortKo = extractKoReturnBlock(payslipSearchSortCopy);
  const adminContractsKo = extractKoLocaleBlockByAnchor(
    contractsCopy,
    "export const adminContractsCopyByLocale"
  );
  const builderContractsKo = extractKoLocaleBlockByAnchor(
    contractsCopy,
    "export const contractTemplateBuilderCopyByLocale"
  );
  const employeeContractsKo = extractKoLocaleBlockByAnchor(
    contractsCopy,
    "export const employeeContractsCopyByLocale"
  );

  assertNoResidualEnglishTokens(extractStringLiterals(withholdingKo), "withholding-receipt");
  assertNoResidualEnglishTokens(extractStringLiterals(payslipPageKo), "payslip-page-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(payslipSearchSortKo), "payslip-search-sort-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(adminContractsKo), "contracts-admin-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(builderContractsKo), "contracts-builder-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(employeeContractsKo), "contracts-employee-copy");

  assert.match(contractsHttp, /\uC694\uCCAD\uC774 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4 \(\$\{status\}\)/);
  assert.match(payslipPage, /\uC778\uC99D \uC138\uC158 \uC0C1\uD0DC\uB97C \uD655\uC778\uD558\uC9C0 \uBABB\uD588\uC2B5\uB2C8\uB2E4\./);
  assert.doesNotMatch(templateChecklist, /"OK"|"FAIL"/);
  assert.match(templateChecklist, /item\.passed \? readyLabel : needsFixLabel/);

  assert.match(workItem, /WI-0579/i);
  assert.match(workItem, /korean|residual|one-shot|ci|guard|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0579/i);
  assert.match(codexGuide, /I18N One-Shot Guard \(WI-0522\)/);
}

run()
  .then(() => {
    console.log("e2e-wi0579-korean-residual-one-shot-and-ci-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
