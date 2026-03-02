import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { resolvePayslipRunStateLabel } from "@/app/employee/payslips/page-locale-deduction-copy";
import { normalizeRuntimeDiagnosticMessage as normalizePayslipRuntimeDiagnosticMessage } from "@/app/employee/payslips/page-locale-runtime";
import {
  normalizeContractsEntityTitle,
  normalizeContractsEvidenceFileName
} from "@/components/contracts/runtime-copy-helpers";
import {
  normalizeRuntimeDiagnosticMessage as normalizeWithholdingRuntimeDiagnosticMessage
} from "@/components/withholding-receipt/copy-runtime";
import { normalizeWithholdingActivityLabel } from "@/components/withholding-receipt/runtime-label-helpers";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0767-ko-runtime-fallback-sweep-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(resolvePayslipRunStateLabel("UNKNOWN_STATE", true), "알 수 없음");
  assert.equal(
    normalizePayslipRuntimeDiagnosticMessage(
      "request failed: failed to fetch",
      true,
      "요청 처리 중 오류가 발생했습니다."
    ),
    "요청이 실패했습니다. 잠시 후 다시 시도해 주세요."
  );

  assert.equal(
    normalizeWithholdingRuntimeDiagnosticMessage(
      "request failed: network error",
      "ko",
      "요청이 실패했습니다."
    ),
    "요청이 실패했습니다. 잠시 후 다시 시도해 주세요."
  );
  assert.equal(normalizeWithholdingActivityLabel("load issued document", "ko"), "원천징수영수증 문서 조회");
  assert.equal(normalizeWithholdingActivityLabel("queue retry", "ko"), "요청 실행");

  assert.equal(normalizeContractsEntityTitle("Employment Contract", "DOC-1001", true), "계약서 DOC-1001");
  assert.equal(
    normalizeContractsEvidenceFileName("signature-evidence-DOC-1001.txt", "DOC-1001", true),
    "계약-증빙-DOC-1001.txt"
  );

  assert.match(
    payslipDerivedState,
    /const year = Number\.isNaN\(period\.getTime\(\)\) \? \(isKoLocale \? "미확인" : "unknown"\) : String\(period\.getFullYear\(\)\);/
  );
  assert.doesNotMatch(
    payslipDerivedState,
    /const year = Number\.isNaN\(period\.getTime\(\)\) \? "unknown" : String\(period\.getFullYear\(\)\);/
  );

  assert.match(workItem, /WI-0767/i);
  assert.match(workItem, /korean|runtime|fallback|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0767/i);
}

run()
  .then(() => {
    console.log("e2e-wi0767-ko-runtime-fallback-sweep-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
