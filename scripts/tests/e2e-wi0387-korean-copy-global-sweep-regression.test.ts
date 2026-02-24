import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function section(source: string, startToken: string, endToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing start token: ${startToken}`);
  const end = source.indexOf(endToken, start);
  assert.ok(end >= 0, `missing end token: ${endToken}`);
  return source.slice(start, end);
}

function objectSectionByBrace(source: string, startToken: string, fromIndex = 0) {
  const start = source.indexOf(startToken, fromIndex);
  assert.ok(start >= 0, `missing start token: ${startToken}`);
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
  throw new Error(`failed to close object section for token: ${startToken}`);
}

function assertNoCorruptedKoPlaceholders(source: string, name: string) {
  assert.doesNotMatch(source, /:\s*"\?\?[^"]*"/, `${name}: corrupted ko placeholder detected`);
}

async function run() {
  const approvalHistory = readUtf8("src", "app", "admin", "approval-history", "page-locale-helpers.ts");
  const approvalPolicy = readUtf8("src", "app", "admin", "approval-policy", "page-locale-helpers.ts");
  const approvalTemplates = readUtf8("src", "app", "admin", "approval-templates", "page-locale-helpers.ts");
  const employeePage = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const payslipLocale = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const approvalQueuePanel = readUtf8("src", "components", "admin-approval", "ApprovalQueuePanel.tsx");
  const attendanceLiveCopy = readUtf8("src", "components", "admin-attendance-live", "copy.ts");
  const adminKpiCopy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const onboardingCopy = readUtf8("src", "components", "admin-onboarding", "copy.ts");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const employeeGuideCopy = readUtf8("src", "components", "employee-guide", "copy.ts");
  const leaveCalendarCopy = readUtf8("src", "components", "leave-calendar", "copy.ts");
  const payrollCloseCopy = readUtf8("src", "components", "payroll-close", "copy.ts");
  const payrollInsuranceCopy = readUtf8("src", "components", "payroll-insurance", "copy.ts");
  const payrollPayslipDeliveryCopy = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "copy.ts"
  );
  const payrollYearEndCopy = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const payrollYearEndFilingCopy = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "copy.ts"
  );
  const employeeYearEndInputCopy = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-year-end-input-copy.ts"
  );
  const workItem = readUtf8("work-items", "WI-0387-korean-copy-global-sweep-and-guard.md");
  const roadmap = readUtf8("ROADMAP.md");

  const koSections = [
    approvalHistory,
    approvalPolicy,
    approvalTemplates,
    employeePage,
    payslipLocale,
    approvalQueuePanel,
    attendanceLiveCopy,
    adminKpiCopy,
    onboardingCopy,
    contractsCopy,
    employeeGuideCopy,
    leaveCalendarCopy,
    payrollCloseCopy,
    payrollInsuranceCopy,
    payrollPayslipDeliveryCopy,
    payrollYearEndCopy,
    payrollYearEndFilingCopy,
    employeeYearEndInputCopy
  ];
  koSections.forEach((source, index) => assertNoCorruptedKoPlaceholders(source, `source-${index}`));

  const approvalHistoryKo = section(approvalHistory, "ko: {", "  en: {");
  assert.match(
    approvalHistoryKo,
    /devActorNotice:\s*"개발 모드에서는 헤더 기반 액터 컨텍스트를 사용합니다\."/
  );
  assert.match(approvalHistoryKo, /accessTokenOptional:\s*"액세스 토큰 \(선택\)"/);
  assert.match(approvalHistoryKo, /fallback:\s*"대체값"/);
  assert.match(approvalHistoryKo, /gross:\s*"총지급액"/);

  const approvalPolicyKo = section(approvalPolicy, "ko: {", "  en: {");
  assert.match(approvalPolicyKo, /configured:\s*"구성됨"/);
  assert.match(approvalPolicyKo, /dryRun:\s*"시뮬레이션"/);
  assert.match(approvalPolicyKo, /defaultFallback:\s*"기본 대체값"/);

  const approvalTemplatesKo = section(approvalTemplates, "ko: {", "  en: {");
  assert.match(approvalTemplatesKo, /rolesLegend:\s*"승인 가능 역할 \(1개 이상\)"/);
  assert.match(approvalTemplatesKo, /actorRole:\s*"검증 액터 역할"/);
  assert.match(approvalTemplatesKo, /templateList:[\s\S]*roles:\s*"역할"/);

  assert.match(employeePage, /devSchedulingCockpit:\s*"\(개발\) 스케줄링 대시보드"/);
  assert.match(approvalQueuePanel, /selectedFilterOn:\s*"선택 필터 적용"/);
  assert.match(approvalQueuePanel, /ok:\s*"성공"/);
  assert.match(approvalQueuePanel, /fail:\s*"실패"/);

  const adminContractsAnchor = contractsCopy.indexOf("export const adminContractsCopyByLocale");
  assert.ok(adminContractsAnchor >= 0, "missing admin contracts locale block");
  const adminContractsKo = objectSectionByBrace(contractsCopy, "ko: {", adminContractsAnchor);
  assert.doesNotMatch(adminContractsKo, /\.\.\.adminContractsCopyEn/);
  assert.match(adminContractsKo, /templateListAria:\s*"계약 템플릿 목록"/);
  assert.match(adminContractsKo, /documentListAria:\s*"계약 문서 목록"/);

  const builderAnchor = contractsCopy.indexOf("export const contractTemplateBuilderCopyByLocale");
  assert.ok(builderAnchor >= 0, "missing contract template builder locale block");
  const builderKo = objectSectionByBrace(contractsCopy, "ko: {", builderAnchor);
  assert.doesNotMatch(builderKo, /\.\.\.contractTemplateBuilderCopyEn/);
  assert.match(builderKo, /clauseBuilderAria:\s*"계약 템플릿 조항 빌더"/);

  const employeeContractsAnchor = contractsCopy.indexOf("export const employeeContractsCopyByLocale");
  assert.ok(employeeContractsAnchor >= 0, "missing employee contracts locale block");
  const employeeContractsKo = objectSectionByBrace(contractsCopy, "ko: {", employeeContractsAnchor);
  assert.doesNotMatch(employeeContractsKo, /\.\.\.employeeContractsCopyEn/);

  const filingKo = section(payrollYearEndFilingCopy, "ko: {", "  en: filingCopyEn");
  assert.match(filingKo, /submissionSearchPlaceholder:\s*"제출 ID, ACK 코드, 메모"/);
  assert.match(filingKo, /settlementHashFilterPlaceholder:\s*"해시 접두어 \(8-64자리 16진수\)"/);
  assert.match(filingKo, /expectedSettlementHashPlaceholder:\s*"64자리 sha256 해시 \(선택\)"/);
  assert.match(filingKo, /timelineActionBadgeLabels:\s*\{[\s\S]*submitted:\s*"제출됨"/);
  assert.match(filingKo, /exportFormatOptionLabels:\s*\{[\s\S]*hometax_csv:\s*"홈택스 CSV"/);
  assert.match(filingKo, /validationModeOptionLabels:\s*\{[\s\S]*basic:\s*"기본"/);

  assert.match(payrollYearEndCopy, /annualSocialInsuranceRunsLabel:\s*"연간 사회보험 합계\(실행 기준\)"/);
  assert.match(
    payslipLocale,
    /bearerPlaceholder:\s*"비어 있으면 액터 헤더 모드\(x-actor-\*\)가 사용됩니다\."/
  );

  assert.match(workItem, /WI-0387/i);
  assert.match(workItem, /원천징수|명세서|전자계약함/);
  assert.match(roadmap, /WI-0387/i);
}

run()
  .then(() => {
    console.log("e2e-wi0387-korean-copy-global-sweep-regression.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
