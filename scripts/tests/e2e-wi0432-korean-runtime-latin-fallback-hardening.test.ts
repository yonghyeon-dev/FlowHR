import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipLocaleHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const payslipReceiptRuntimeHelpers = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0432-korean-runtime-latin-fallback-hardening.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipLocaleHelpers, /function hasLatinText\(value: string\)/);
  assert.match(payslipLocaleHelpers, /if \(!hasLatinText\(normalized\)\) \{\s*return normalized;\s*\}/);
  assert.doesNotMatch(payslipLocaleHelpers, /function isAsciiHeavyText\(value: string\)/);

  assert.match(payslipReceiptRuntimeHelpers, /function hasLatinText\(value: string\)/);
  assert.match(
    payslipReceiptRuntimeHelpers,
    /if \(!hasLatinText\(normalized\)\) \{\s*return normalized;\s*\}/
  );
  assert.doesNotMatch(payslipReceiptRuntimeHelpers, /function isAsciiHeavyText\(value: string\)/);

  assert.match(contractsHttp, /return \/\[A-Za-z\]\/\.test\(normalized\);/);
  assert.doesNotMatch(contractsHttp, /asciiCount \//);

  assert.match(withholdingConsole, /function hasLatinText\(value: string\)/);
  assert.match(withholdingConsole, /if \(!hasLatinText\(normalized\)\) \{\s*return normalized;\s*\}/);
  assert.doesNotMatch(withholdingConsole, /function isAsciiHeavyText\(value: string\)/);

  assert.match(workItem, /WI-0432/i);
  assert.match(workItem, /korean|runtime|fallback|latin|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0432/i);
}

run()
  .then(() => {
    console.log("e2e-wi0432-korean-runtime-latin-fallback-hardening.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
