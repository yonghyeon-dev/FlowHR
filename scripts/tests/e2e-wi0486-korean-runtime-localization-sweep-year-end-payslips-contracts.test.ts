import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  extractPayrollYearEndErrorMessage,
  normalizePayrollYearEndRuntimeMessage,
  resolvePayrollYearEndBlockingReasons,
  resolvePayrollYearEndReasonCodeLabel,
  resolvePayrollYearEndReconciliationStatusLabel
} from "@/components/payroll-year-end/runtime-copy-helpers";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function hasLatinText(value: string) {
  return /[A-Za-z]/.test(value);
}

async function run() {
  const yearEndConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndConsole.tsx"
  );
  const preflightConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndPreflightConsole.tsx"
  );
  const employeeYearEndInputConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const employeeYearEndInputCopySource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-year-end-input-copy.ts"
  );
  const payrollTypesSource = readUtf8("src", "components", "payroll-year-end", "types.ts");
  const payslipPageSource = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipDerivedSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const contractsInboxSource = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const contractsRuntimeHelperSource = readUtf8(
    "src",
    "components",
    "contracts",
    "runtime-copy-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0486-korean-runtime-localization-sweep-year-end-payslips-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(resolvePayrollYearEndReasonCodeLabel("CAPPED_BY_RULE", "ko"), "규정 상한 적용");
  assert.equal(resolvePayrollYearEndReasonCodeLabel("APPLIED_AS_ENTERED", "ko"), "입력값 적용");
  assert.equal(resolvePayrollYearEndReasonCodeLabel("NO_INPUT", "ko"), "입력 없음");
  assert.equal(resolvePayrollYearEndReconciliationStatusLabel("matched", "ko"), "일치");
  assert.equal(resolvePayrollYearEndReconciliationStatusLabel("mismatch", "ko"), "불일치");
  assert.equal(
    resolvePayrollYearEndReconciliationStatusLabel("pending_finalization", "ko"),
    "확정 대기"
  );

  const koBlockingReasons = resolvePayrollYearEndBlockingReasons(
    [
      "all payroll runs must be confirmed before withholding receipt issue",
      "personalPensionKrw deduction is not eligible for selected employee/year"
    ],
    "ko"
  );
  assert.equal(koBlockingReasons.length, 2);
  assert.ok(koBlockingReasons.every((reason) => !hasLatinText(reason)));

  assert.equal(
    normalizePayrollYearEndRuntimeMessage("request failed: timeout", "ko", "요청 실패"),
    "요청이 실패했습니다. 잠시 후 다시 시도해 주세요."
  );
  assert.equal(
    extractPayrollYearEndErrorMessage({ error: "employeeId is required" }, "ko", "요청 실패"),
    "직원 번호는 필수입니다."
  );

  assert.match(yearEndConsoleSource, /resolvePayrollYearEndBlockingReasons/);
  assert.match(yearEndConsoleSource, /resolvePayrollYearEndReasonCodeLabel/);
  assert.match(yearEndConsoleSource, /resolvePayrollYearEndReconciliationStatusLabel/);
  assert.match(yearEndConsoleSource, /extractPayrollYearEndErrorMessage/);
  assert.match(yearEndConsoleSource, /normalizePayrollYearEndRuntimeMessage/);
  assert.match(preflightConsoleSource, /normalizePayrollYearEndRuntimeMessage/);
  assert.match(employeeYearEndInputConsoleSource, /normalizePayrollYearEndRuntimeMessage/);

  assert.match(employeeYearEndInputConsoleSource, /placeholder=\{copy\.bearerTokenPlaceholder\}/);
  assert.doesNotMatch(employeeYearEndInputConsoleSource, /placeholder="Bearer token"/);
  assert.match(employeeYearEndInputCopySource, /bearerTokenPlaceholder:\s*"액세스 토큰"/);
  assert.match(employeeYearEndInputCopySource, /bearerTokenPlaceholder:\s*"Bearer token"/);

  assert.match(payrollTypesSource, /startsWith\("ko"\) \? "원" : " KRW"/);
  assert.match(payslipDerivedSource, /filePrefix = isKoLocale \? "플로우HR-급여명세" : "flowhr-payslip"/);
  assert.match(payslipPageSource, /csvPrefix = isKoLocale \? "플로우HR-명세서" : "flowhr-payslips"/);

  assert.match(contractsRuntimeHelperSource, /export function normalizeContractsEvidenceFileName/);
  assert.match(contractsInboxSource, /normalizeContractsEvidenceFileName/);

  assert.match(workItem, /WI-0486/i);
  assert.match(workItem, /korean|runtime|localization|year-end|payslip|contracts/i);
  assert.match(roadmap, /WI-0486/i);
}

run()
  .then(() => {
    console.log("e2e-wi0486-korean-runtime-localization-sweep-year-end-payslips-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
