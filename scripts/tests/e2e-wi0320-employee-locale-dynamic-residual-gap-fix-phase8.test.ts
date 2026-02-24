import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0320-employee-locale-dynamic-residual-gap-fix-phase8.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /surfaceCopy/);
  assert.match(
    employeePage,
    /const \{ attendance: attendanceCopy, leave: leaveCopy, leaveCalendar: leaveCalendarCopy, schedule: scheduleCopy, apiLogs: apiLogsCopy \} =\s*surfaceCopy;/
  );
  assert.match(employeePage, /\{attendanceCopy\.checkInTime\}/);
  assert.match(employeePage, /\{leaveCopy\.requestUnit\}/);
  assert.match(employeePage, /\{leaveCalendarCopy\.usageRateLabel\}/);
  assert.match(employeePage, /\{scheduleCopy\.devSchedulingCockpit\}/);
  assert.match(employeePage, /\{apiLogsCopy\.runningNow\}/);
  assert.match(employeePage, /\{apiLogsCopy\.summary\(stats\.success, stats\.fail\)\}/);

  assert.match(employeePage, /<h2>\{isKoLocale \? "출퇴근" : "Attendance"\}<\/h2>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "휴가" : "Leave"\}<\/h2>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "휴가 캘린더" : "Leave calendar"\}<\/h2>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "근무 일정" : "Work schedule"\}<\/h2>/);

  assert.doesNotMatch(employeePage, /\{isKoLocale \? "출근 시각" : "Check-in time"\}/);
  assert.doesNotMatch(employeePage, /\{isKoLocale \? "휴가 유형" : "Leave type"\}/);
  assert.doesNotMatch(employeePage, /\{isKoLocale \? "연차 사용률" : "Leave usage rate"\}/);
  assert.doesNotMatch(employeePage, /\{isKoLocale \? "현재 실행 중" : "Running now"\}/);

  assert.match(employeeLocaleHelpers, /const EMPLOYEE_SURFACE_COPY_BY_LOCALE =/);
  assert.match(employeeLocaleHelpers, /surfaceCopy: EMPLOYEE_SURFACE_COPY_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /attendance: \{/);
  assert.match(employeeLocaleHelpers, /leaveCalendar: \{/);
  assert.match(employeeLocaleHelpers, /apiLogs: \{/);

  const employeePageLineCount = employeePage.split(/\r?\n/).length;
  assert.ok(
    employeePageLineCount < 2100,
    `expected employee page line count below 2100, got ${employeePageLineCount}`
  );

  assert.match(workItem, /WI-0320/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /residual/i);
  assert.match(roadmap, /WI-0320/i);
}

run()
  .then(() => {
    console.log("e2e-wi0320-employee-locale-dynamic-residual-gap-fix-phase8.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
