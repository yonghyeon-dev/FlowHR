import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  resolvePayslipRunStateLabel,
  resolveDeductionDescriptionMap
} from "@/app/employee/payslips/page-locale-deduction-copy";
import { resolvePayslipPageCopy } from "@/app/employee/payslips/page-locale-page-copy";
import {
  extractErrorMessage,
  formatCompareWindowLabel,
  formatDiffKrw,
  formatKrw,
  resolveCompareInsightAriaLabel,
  resolveCompareInsightTitle,
  setPayslipRuntimeLocale
} from "@/app/employee/payslips/page-locale-runtime";
import { resolvePayslipSearchSortCopy } from "@/app/employee/payslips/page-locale-search-sort-copy";
import { contractJourneyCopyByLocale } from "@/components/contracts/journey-copy";
import { normalizeContractsEntityTitle } from "@/components/contracts/runtime-copy-helpers";
import {
  defaultEmployeeIdForApi,
  formatEmployeeIdForLocaleDisplay,
  getLocalizedEmployeeIdInputDefault,
  normalizeEmployeeIdForApi,
  normalizeEmployeeIdForLocaleInput
} from "@/lib/i18n/employee-id-locale";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0481-korean-copy-residual-runtime-hardening-withholding-payslip-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const koPageCopy = resolvePayslipPageCopy(true);
  const koSearchSortCopy = resolvePayslipSearchSortCopy(true);

  assert.equal(koPageCopy.pageTitle, "급여 명세서");
  assert.equal(koPageCopy.devTools.bearerStatusLabel, "토큰 모드");
  assert.equal(koPageCopy.detail.sheetEyebrow, "FlowHR 급여 명세서");
  assert.equal(koSearchSortCopy.title, "명세서 검색/정렬");
  assert.equal(koSearchSortCopy.scope.runId, "실행 번호");

  assert.equal(resolvePayslipRunStateLabel("CONFIRMED", true), "확정");
  assert.equal(resolvePayslipRunStateLabel("PREVIEWED", true), "미확정");
  assert.equal(resolvePayslipRunStateLabel("UNKNOWN", true), "알 수 없음");

  const deductionCopy = resolveDeductionDescriptionMap(true);
  assert.equal(deductionCopy.withholdingTaxKrw?.label, "원천세");
  assert.equal(deductionCopy.socialInsuranceKrw?.label, "사회보험");

  setPayslipRuntimeLocale("ko-KR");
  assert.equal(formatKrw(1200), "1,200원");
  assert.equal(formatDiffKrw(-200), "-200원");
  assert.equal(resolveCompareInsightTitle(true), "전월 대비 설명");
  assert.equal(resolveCompareInsightAriaLabel(true), "전월 대비 설명 카드");
  assert.equal(formatCompareWindowLabel("2026-01", "2025-12", true), "2026-01 대비 2025-12");
  assert.equal(extractErrorMessage(null), "원인을 확인할 수 없습니다.");
  setPayslipRuntimeLocale(null);

  assert.equal(defaultEmployeeIdForApi, "EMP-1001");
  assert.equal(getLocalizedEmployeeIdInputDefault("ko"), "직원-1001");
  assert.equal(normalizeEmployeeIdForApi("직원-1001", "ko"), "EMP-1001");
  assert.equal(normalizeEmployeeIdForLocaleInput("EMP-1001", "ko"), "직원-1001");
  assert.equal(formatEmployeeIdForLocaleDisplay("EMP-1001", "ko"), "직원-1001");

  assert.equal(contractJourneyCopyByLocale.ko.timelineTitle, "서명 여정 타임라인");
  assert.equal(contractJourneyCopyByLocale.ko.recoveryTitle, "복구 가이드");
  assert.equal(normalizeContractsEntityTitle("", "DOC-12345678", true), "계약서 DOC-1234");

  assert.match(withholdingConsole, /locale === "ko" \? "\\uC6D0" : " KRW"/);
  assert.match(withholdingConsole, /return "\\uAD6C\\uC870 \\uB370\\uC774\\uD130";/);
  assert.match(withholdingConsole, /return "\\uD14D\\uC2A4\\uD2B8 \\uB370\\uC774\\uD130";/);

  assert.doesNotMatch(payslipFilterPanel, /쨌/);

  assert.match(workItem, /WI-0481/i);
  assert.match(workItem, /korean|copy|runtime|withholding|payslip|contracts/i);
  assert.match(roadmap, /WI-0481/i);
}

run()
  .then(() => {
    console.log("e2e-wi0481-korean-copy-residual-runtime-hardening-withholding-payslip-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
