import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipConsole = readUtf8("src", "components", "payslip-receipts", "PayslipReceiptConsole.tsx");
  const payslipCopy = readUtf8("src", "components", "payslip-receipts", "copy.ts");
  const leaveCalendarConsole = readUtf8("src", "components", "leave-calendar", "LeaveCalendarConsole.tsx");
  const leaveCalendarCopy = readUtf8("src", "components", "leave-calendar", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0294-locale-dynamic-ui-gap-fix-payslip-leave-calendar.md"
  );

  assert.match(payslipConsole, /useI18n\(\)/);
  assert.match(payslipConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(payslipConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(payslipConsole, /copy\.loadPayslipsAction/);
  assert.match(payslipConsole, /copy\.apiLogsTitle/);

  assert.match(leaveCalendarConsole, /useI18n\(\)/);
  assert.match(leaveCalendarConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(leaveCalendarConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(leaveCalendarConsole, /copy\.loadCalendarAction/);
  assert.match(leaveCalendarConsole, /copy\.apiLogsTitle/);

  assert.match(payslipCopy, /payslipReceiptCopyByLocale: Record<FlowLocale, PayslipReceiptCopy>/);
  assert.match(payslipCopy, /ko:\s*\{/);
  assert.match(payslipCopy, /en:\s*\{/);
  assert.match(payslipCopy, /title:\s*"급여명세 수신 확인"/);
  assert.match(payslipCopy, /title:\s*"Payslip Receipt Confirmation"/);

  assert.match(leaveCalendarCopy, /leaveCalendarCopyByLocale: Record<FlowLocale, LeaveCalendarCopy>/);
  assert.match(leaveCalendarCopy, /ko:\s*\{/);
  assert.match(leaveCalendarCopy, /en:\s*\{/);
  assert.match(leaveCalendarCopy, /title:\s*"휴가 캘린더"/);
  assert.match(leaveCalendarCopy, /title:\s*"Leave Calendar"/);

  assert.match(workItem, /WI-0294/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /\/employee\/payslip-receipts/);
  assert.match(workItem, /\/admin\/leave-calendar/);
}

run()
  .then(() => {
    console.log("e2e-wi0294-locale-dynamic-ui-gap-fix-payslip-leave-calendar.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
