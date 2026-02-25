import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipLocaleRuntime = readUtf8("src", "app", "employee", "payslips", "page-locale-runtime.ts");
  const payslipReceiptRuntimeHelpers = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const withholdingCopyRuntime = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const workItem = readUtf8("work-items", "WI-0432-korean-runtime-latin-fallback-hardening.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipLocaleRuntime, /function hasLatinText\(value: string\)/);
  assert.match(payslipLocaleRuntime, /if \(!hasLatinText\(normalized\)\) \{\s*return normalized;\s*\}/);
  assert.doesNotMatch(payslipLocaleRuntime, /function isAsciiHeavyText\(value: string\)/);

  assert.match(payslipReceiptRuntimeHelpers, /function hasLatinText\(value: string\)/);
  assert.match(
    payslipReceiptRuntimeHelpers,
    /if \(!hasLatinText\(normalized\)\) \{\s*return normalized;\s*\}/
  );
  assert.doesNotMatch(payslipReceiptRuntimeHelpers, /function isAsciiHeavyText\(value: string\)/);

  assert.match(contractsHttp, /return \/\[A-Za-z\]\/\.test\(normalized\);/);
  assert.doesNotMatch(contractsHttp, /asciiCount \//);

  assert.match(withholdingCopyRuntime, /function hasLatinText\(value: string\)/);
  assert.match(withholdingCopyRuntime, /if \(!hasLatinText\(normalized\)\) \{\s*return normalized;\s*\}/);
  assert.doesNotMatch(withholdingCopyRuntime, /function isAsciiHeavyText\(value: string\)/);

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
