import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { normalizeContractsErrorMessageForRuntime, setContractsRuntimeLocale } from "@/components/contracts/http";
import { normalizePayslipReceiptRuntimeMessage } from "@/components/payslip-receipts/runtime-copy-helpers";
import { normalizeRuntimeDiagnosticMessage as normalizePayslipRuntimeDiagnosticMessage } from "@/app/employee/payslips/page-locale-runtime";
import { normalizeRuntimeDiagnosticMessage as normalizeWithholdingRuntimeDiagnosticMessage } from "@/components/withholding-receipt/copy-runtime";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function assertKoMessage(value: string) {
  assert.match(value, /[\uac00-\ud7a3]/, `message should include Hangul: ${value}`);
  assert.doesNotMatch(value, /[A-Za-z]/, `message should suppress Latin tokens: ${value}`);
}

async function run() {
  const payslipRuntimeHelper = readUtf8("src", "components", "payslip-receipts", "runtime-copy-helpers.ts");
  const payslipLocaleRuntime = readUtf8("src", "app", "employee", "payslips", "page-locale-runtime.ts");
  const withholdingRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0462-korean-runtime-message-guard-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipRuntimeHelper, /timeout\|timed out\|gateway timeout/i);
  assert.match(payslipLocaleRuntime, /timeout\|timed out\|gateway timeout/i);
  assert.match(withholdingRuntime, /timeout\|timed out\|gateway timeout/i);
  assert.match(contractsHttp, /timeout\|timed out\|gateway timeout/i);

  const koPayslipTimeout = normalizePayslipReceiptRuntimeMessage(
    "gateway timeout",
    "ko",
    "\uC694\uCCAD \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
  );
  assertKoMessage(koPayslipTimeout);

  const koPayslipDiagnostic = normalizePayslipRuntimeDiagnosticMessage(
    "internal server error",
    true,
    "\uC694\uCCAD \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
  );
  assertKoMessage(koPayslipDiagnostic);

  const koWithholdingDiagnostic = normalizeWithholdingRuntimeDiagnosticMessage(
    "timed out while fetching",
    "ko",
    "\uC694\uCCAD \uCC98\uB9AC \uC911 \uC624\uB958\uAC00 \uBC1C\uC0DD\uD588\uC2B5\uB2C8\uB2E4."
  );
  assertKoMessage(koWithholdingDiagnostic);

  setContractsRuntimeLocale("ko");
  const koContractsMessage = normalizeContractsErrorMessageForRuntime(
    "service unavailable",
    "\uC694\uCCAD\uC774 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4."
  );
  assertKoMessage(koContractsMessage);
  setContractsRuntimeLocale(null);

  const enPayslipMessage = normalizePayslipReceiptRuntimeMessage(
    "gateway timeout",
    "en",
    "request failed"
  );
  assert.equal(enPayslipMessage, "gateway timeout");

  assert.match(workItem, /WI-0462/i);
  assert.match(workItem, /korean|runtime|message|guard|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0462/i);
}

run()
  .then(() => {
    console.log("e2e-wi0462-korean-runtime-message-guard-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
