import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipRuntime = await import("../../src/app/employee/payslips/page-locale-runtime.ts");
  const withholdingRuntime = await import("../../src/components/withholding-receipt/copy-runtime.ts");
  const contractsHttp = await import("../../src/components/contracts/http.ts");

  const workItem = readUtf8(
    "work-items",
    "WI-0483-korean-runtime-mixed-language-suppression-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const payslipFallback = "요청 처리 중 오류가 발생했습니다.";
  assert.equal(
    payslipRuntime.normalizeRuntimeDiagnosticMessage("employee id required (직원)", true, payslipFallback),
    "직원 번호는 필수입니다."
  );
  assert.equal(
    payslipRuntime.normalizeRuntimeDiagnosticMessage(
      "Unhandled Error: 처리 실패",
      true,
      payslipFallback
    ),
    payslipFallback
  );
  assert.equal(
    payslipRuntime.normalizeRuntimeDiagnosticMessage("처리 실패", true, payslipFallback),
    "처리 실패"
  );

  const withholdingFallback = "요청이 실패했습니다.";
  assert.equal(
    withholdingRuntime.normalizeRuntimeDiagnosticMessage(
      "employee id required (직원)",
      "ko",
      withholdingFallback
    ),
    "직원 번호는 필수입니다."
  );
  assert.equal(
    withholdingRuntime.normalizeRuntimeDiagnosticMessage(
      "Unhandled Error: 처리 실패",
      "ko",
      withholdingFallback
    ),
    withholdingFallback
  );
  assert.equal(
    withholdingRuntime.normalizeRuntimeDiagnosticMessage("처리 실패", "ko", withholdingFallback),
    "처리 실패"
  );

  contractsHttp.setContractsRuntimeLocale("ko");
  try {
    assert.equal(
      contractsHttp.normalizeContractsErrorMessageForRuntime(
        "employee id required (직원)",
        "요청이 실패했습니다 (400)"
      ),
      "직원 번호는 필수입니다."
    );
    assert.equal(
      contractsHttp.normalizeContractsErrorMessageForRuntime(
        "Unhandled Error: 처리 실패",
        "요청이 실패했습니다 (500)"
      ),
      "요청이 실패했습니다 (500)"
    );
    assert.equal(
      contractsHttp.normalizeContractsErrorMessageForRuntime(
        "처리 실패",
        "요청이 실패했습니다 (500)"
      ),
      "처리 실패"
    );
  } finally {
    contractsHttp.setContractsRuntimeLocale(null);
  }

  assert.match(workItem, /WI-0483/i);
  assert.match(workItem, /korean|runtime|mixed|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0483/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0483-korean-runtime-mixed-language-suppression-withholding-payslip-contracts.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
