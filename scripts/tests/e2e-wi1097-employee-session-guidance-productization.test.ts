import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const productLanguage = readUtf8("src", "lib", "product-language.ts");
const employeePageHelpers = readUtf8("src", "app", "employee", "page-helpers.ts");
const employeeOnboarding = readUtf8("src", "app", "employee", "onboarding", "page.tsx");
const employeeBenefits = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
const employeeGuide = readUtf8("src", "components", "employee-guide", "useEmployeeGuideData.ts");
const employeeNotices = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
const employeeRecruitment = readUtf8("src", "components", "recruitment", "EmployeeRecruitmentWorkspace.tsx");
const employeeSchedule = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
const employeePayslips = readUtf8("src", "app", "employee", "payslips", "page.tsx");
const employeeYearEnd = readUtf8("src", "components", "payroll-year-end", "EmployeeYearEndInputConsole.tsx");
const withholdingCopy = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
const payslipReceiptCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
const workItem = readUtf8("work-items", "WI-1097-employee-session-guidance-productization.md");
const progress = readUtf8("docs", "production-operating-progress.md");
const gapInventory = readUtf8("docs", "production-gap-inventory.md");

assert.match(productLanguage, /export function formatLoginSessionRequiredNotice\(locale: string\)/);
assert.match(productLanguage, /export function formatEmployeeNumberRequiredNotice\(locale: string\)/);

for (const source of [
  employeePageHelpers,
  employeeOnboarding,
  employeeBenefits,
  employeeGuide,
  employeeNotices,
  employeeRecruitment,
  employeeSchedule,
  employeePayslips,
  employeeYearEnd,
  withholdingCopy,
  payslipReceiptCopy
]) {
  assert.doesNotMatch(source, /프로덕션에서는 로그인 세션이 필요합니다/);
  assert.doesNotMatch(source, /A login session is required in production/);
}

assert.match(employeePageHelpers, /formatLoginSessionRequiredNotice\(/);
assert.match(employeePageHelpers, /formatEmployeeNumberRequiredNotice\(/);
assert.match(employeeOnboarding, /formatLoginSessionRequiredNotice\("ko"\)/);
assert.match(employeeOnboarding, /formatEmployeeNumberRequiredNotice\("ko"\)/);
assert.match(employeeBenefits, /formatLoginSessionRequiredNotice\(locale\)/);
assert.match(employeeGuide, /formatLoginSessionRequiredNotice\(/);
assert.match(employeeNotices, /formatLoginSessionRequiredNotice\(locale\)/);
assert.match(employeeRecruitment, /formatLoginSessionRequiredNotice\(locale\)/);
assert.match(employeeSchedule, /formatLoginSessionRequiredNotice\(locale\)/);
assert.match(employeePayslips, /formatLoginSessionRequiredNotice\(locale\)/);
assert.match(employeeYearEnd, /formatLoginSessionRequiredNotice\(locale\)/);
assert.match(withholdingCopy, /formatLoginSessionRequiredNotice\("ko"\)/);
assert.match(withholdingCopy, /formatLoginSessionRequiredNotice\("en"\)/);
assert.match(payslipReceiptCopy, /formatLoginSessionRequiredNotice\("ko"\)/);
assert.match(payslipReceiptCopy, /formatLoginSessionRequiredNotice\("en"\)/);

assert.match(workItem, /WI-1097/i);
assert.match(progress, /WI-1097/i);
assert.match(gapInventory, /WI-1097/i);

console.log("e2e-wi1097-employee-session-guidance-productization.test passed");
