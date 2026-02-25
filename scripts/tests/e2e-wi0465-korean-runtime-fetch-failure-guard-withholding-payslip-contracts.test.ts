import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { normalizeRuntimeDiagnosticMessage as normalizePayslipRuntimeDiagnosticMessage } from "@/app/employee/payslips/page-locale-runtime";
import {
  normalizeContractsErrorMessageForRuntime,
  setContractsRuntimeLocale
} from "@/components/contracts/http";
import { normalizePayslipReceiptRuntimeMessage } from "@/components/payslip-receipts/runtime-copy-helpers";
import { normalizeRuntimeDiagnosticMessage as normalizeWithholdingRuntimeDiagnosticMessage } from "@/components/withholding-receipt/copy-runtime";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function hasHangul(value: string) {
  return /[\uac00-\ud7a3]/.test(value);
}

async function run() {
  const payslipReceiptsSource = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "runtime-copy-helpers.ts"
  );
  const payslipRuntimeSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-runtime.ts"
  );
  const withholdingRuntimeSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const contractsSource = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0465-korean-runtime-fetch-failure-guard-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  for (const source of [
    payslipReceiptsSource,
    payslipRuntimeSource,
    withholdingRuntimeSource,
    contractsSource
  ]) {
    assert.match(source, /failed to fetch/i);
    assert.match(source, /fetch failed/i);
    assert.match(source, /econnreset|econnrefused|enotfound|getaddrinfo/i);
  }

  const koFallback = "요청 처리 중 오류가 발생했습니다.";
  const rawFetchFailure = "TypeError: fetch failed";
  const rawConnFailure = "ECONNRESET while requesting";

  const koPayslipReceipt = normalizePayslipReceiptRuntimeMessage(rawFetchFailure, "ko", koFallback);
  assert.ok(hasHangul(koPayslipReceipt));

  const koPayslipRuntime = normalizePayslipRuntimeDiagnosticMessage(rawFetchFailure, true, koFallback);
  assert.ok(hasHangul(koPayslipRuntime));

  const koWithholdingRuntime = normalizeWithholdingRuntimeDiagnosticMessage(
    rawConnFailure,
    "ko",
    koFallback
  );
  assert.ok(hasHangul(koWithholdingRuntime));

  setContractsRuntimeLocale("ko");
  const koContractsRuntime = normalizeContractsErrorMessageForRuntime(rawFetchFailure, koFallback);
  assert.ok(hasHangul(koContractsRuntime));
  setContractsRuntimeLocale(null);

  const enPayslipReceipt = normalizePayslipReceiptRuntimeMessage(rawFetchFailure, "en", koFallback);
  assert.equal(enPayslipReceipt, rawFetchFailure);

  assert.match(workItem, /WI-0465/i);
  assert.match(workItem, /korean|runtime|fetch|failure|guard|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0465/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0465-korean-runtime-fetch-failure-guard-withholding-payslip-contracts.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
