import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeValidationHelpers = readUtf8("src", "app", "employee", "page-validation-helpers.ts");
  const employeeDerivedHelpers = readUtf8("src", "app", "employee", "page-derived-helpers.ts");
  const employeeRequestHelpers = readUtf8("src", "app", "employee", "page-request-helpers.ts");
  const employeeInteractionActions = readUtf8(
    "src",
    "app",
    "employee",
    "page-interaction-actions.ts"
  );
  const employeeValidationSources = `${employeePage}\n${employeeValidationHelpers}`;
  const employeeDerivedSources = `${employeePage}\n${employeeDerivedHelpers}\n${employeeRequestHelpers}`;
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0322-employee-locale-validation-error-copy-split-phase9.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /validationCopy/);
  assert.ok(
    /feedback: feedbackCopy\.pendingRequestFilterApplied/.test(employeePage) ||
      /feedback:\s*input\.feedbackCopy\.pendingRequestFilterApplied/.test(employeeInteractionActions)
  );
  assert.match(employeeValidationSources, /correctionValidationCopy\.missingTargetRecordId/);
  assert.match(employeeValidationSources, /attendanceCheckCopy\.targetLabel/);
  assert.match(employeeValidationSources, /leaveCheckCopy\.startDateFormatLabel/);
  assert.match(employeeValidationSources, /resubmitFlowCheckCopy\.candidateLabel/);
  assert.match(employeeValidationSources, /submitChecklistCardCopy\.attendanceCorrectionLabel/);
  assert.match(employeeDerivedSources, /defaultsCopy\.noReasonProvided/);
  assert.match(employeeDerivedSources, /summaryCardCopy\.pendingRequestsLabel/);

  assert.doesNotMatch(employeePage, /feedback: isKoLocale \? "대기 요청 필터가 적용되었습니다\."/);
  assert.doesNotMatch(employeePage, /return \{ isValid: false, message: "정정 대상 기록 ID를 선택해 주세요\." \};/);
  assert.doesNotMatch(employeePage, /label: "정정 대상 선택"/);
  assert.doesNotMatch(employeePage, /label: "휴가 신청 제출"/);

  assert.match(employeeLocaleHelpers, /const EMPLOYEE_VALIDATION_COPY_BY_LOCALE =/);
  assert.match(
    employeeLocaleHelpers,
    /validationCopy: EMPLOYEE_VALIDATION_COPY_BY_LOCALE\[localeKey\]/
  );
  assert.match(employeeLocaleHelpers, /correctionValidation: \{/);
  assert.match(employeeLocaleHelpers, /attendanceChecks: \{/);
  assert.match(employeeLocaleHelpers, /leaveChecks: \{/);
  assert.match(employeeLocaleHelpers, /submitChecklistCards: \{/);

  const employeePageLineCount = employeePage.split(/\r?\n/).length;
  assert.ok(
    employeePageLineCount < 2100,
    `expected employee page line count below 2100, got ${employeePageLineCount}`
  );

  assert.match(workItem, /WI-0322/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /validation|error/i);
  assert.match(roadmap, /WI-0322/i);
}

run()
  .then(() => {
    console.log("e2e-wi0322-employee-locale-validation-error-copy-split-phase9.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
