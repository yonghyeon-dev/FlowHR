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

function isAllowedKoAsciiToken(token: string) {
  return (
    /^FlowHR$/i.test(token) ||
    /^EMP$/i.test(token) ||
    /^EMP-\d+$/i.test(token) ||
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

async function run() {
  const packageJson = readUtf8("package.json");
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0655-ko-surface-one-shot-sweep-and-ci-guard.md");
  const codexGuide = readUtf8("docs", "codex-guide.md");

  const withholdingCopyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const withholdingRuntimeLabels = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "runtime-label-helpers.ts"
  );
  const payslipPageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const payslipSearchSortCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-search-sort-copy.ts");
  const payslipDeductionCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-deduction-copy.ts");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const contractsJourneyCopy = readUtf8("src", "components", "contracts", "journey-copy.ts");
  const contractsRuntimeCopyHelpers = readUtf8("src", "components", "contracts", "runtime-copy-helpers.ts");

  const withholdingKo = extractKoLocaleBlockByAnchor(withholdingCopyRuntime, "export const withholdingReceiptCopyByLocale");
  const payslipPageKo = extractKoReturnBlock(payslipPageCopy);
  const payslipSearchSortKo = extractKoReturnBlock(payslipSearchSortCopy);
  const payslipDeductionKo = extractKoReturnBlock(payslipDeductionCopy);
  const adminContractsKo = extractKoLocaleBlockByAnchor(contractsCopy, "export const adminContractsCopyByLocale");
  const builderContractsKo = extractKoLocaleBlockByAnchor(
    contractsCopy,
    "export const contractTemplateBuilderCopyByLocale"
  );
  const employeeContractsKo = extractKoLocaleBlockByAnchor(contractsCopy, "export const employeeContractsCopyByLocale");
  const contractsJourneyKo = extractKoLocaleBlockByAnchor(contractsJourneyCopy, "export const contractJourneyCopyByLocale");

  assertNoResidualEnglishTokens(extractStringLiterals(withholdingKo), "withholding-receipt");
  assertNoResidualEnglishTokens(extractStringLiterals(payslipPageKo), "payslip-page-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(payslipSearchSortKo), "payslip-search-sort-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(payslipDeductionKo), "payslip-deduction-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(adminContractsKo), "contracts-admin-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(builderContractsKo), "contracts-builder-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(employeeContractsKo), "contracts-employee-copy");
  assertNoResidualEnglishTokens(extractStringLiterals(contractsJourneyKo), "contracts-journey-copy");

  const runtimeLabelKoMap = objectSectionByBrace(
    withholdingRuntimeLabels,
    "const withholdingActivityLabelKoMap: Record<string, string> = {"
  );
  assertNoResidualEnglishTokens(extractStringLiterals(runtimeLabelKoMap), "withholding-runtime-label-ko-map");
  assert.match(withholdingRuntimeLabels, /return "요청 실행";/);

  assert.match(contractsRuntimeCopyHelpers, /return `계약서 \${stableId\.slice\(0, 8\)}`;/);
  assert.match(
    contractsRuntimeCopyHelpers,
    /const fallbackName = `계약-증빙-\${stableId\.slice\(0, 8\)}\${extension}`;/
  );

  assert.match(packageJson, /"test:e2e:ko-guard":\s*"npm run test:e2e:ko-guard:current"/);
  assert.match(
    packageJson,
    /"test:e2e:ko-guard:current":\s*"[^"]*e2e-wi0522-i18n-one-shot-sweep-ci-guard\.test\.ts[^"]*e2e-wi0579-korean-residual-one-shot-and-ci-guard\.test\.ts[^"]*e2e-wi0655-ko-surface-one-shot-sweep-and-ci-guard\.test\.ts"/
  );

  assert.match(codexGuide, /I18N One-Shot Guard \(WI-0522\)/);
  assert.match(codexGuide, /single sweep/i);
  assert.match(codexGuide, /three times in a row/i);

  assert.match(workItem, /WI-0655/i);
  assert.match(workItem, /korean|one-shot|ci|guard|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0655/i);
}

run()
  .then(() => {
    console.log("e2e-wi0655-ko-surface-one-shot-sweep-and-ci-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
