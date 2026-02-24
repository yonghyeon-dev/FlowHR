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
    "WI-0314-employee-locale-dynamic-ui-gap-fix-phase4-and-locale-helper-split.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-locale-helpers"/);
  assert.match(
    employeePage,
    /const localeLabelBundle = useMemo\(\(\) => resolveEmployeeLocaleLabelBundle\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(employeePage, /isDefaultEmployeeCancelReason\(previous\)/);
  assert.match(employeePage, /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \?\? notConfiguredLabel;/);
  assert.match(employeePage, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(employeePage, /attendanceNotePresets\.map\(\(preset\) => \(/);
  assert.match(employeePage, /leaveCalendarWeekdays\.map\(\(weekday\) => \(/);

  assert.match(employeePage, /<h2>\{isKoLocale \? "출퇴근" : "Attendance"\}<\/h2>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "휴가" : "Leave"\}<\/h2>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "휴가 캘린더" : "Leave calendar"\}<\/h2>/);
  assert.match(employeePage, /<h2>\{isKoLocale \? "근무 일정" : "Work schedule"\}<\/h2>/);

  assert.doesNotMatch(employeePage, /const LEAVE_CALENDAR_WEEKDAYS =/);
  assert.doesNotMatch(employeePage, /const ATTENDANCE_NOTE_PRESETS =/);
  assert.doesNotMatch(employeePage, /toLocaleString\("ko-KR"\)/);

  assert.match(employeeLocaleHelpers, /export function resolveEmployeeLocaleLabelBundle\(isKoLocale: boolean\)/);
  assert.match(employeeLocaleHelpers, /export function isDefaultEmployeeCancelReason\(reason: string\)/);
  assert.match(employeeLocaleHelpers, /export function formatEmployeeDeltaMinutes\(/);
  assert.match(employeeLocaleHelpers, /export function extractEmployeeErrorMessage\(/);
  assert.match(employeeLocaleHelpers, /leaveCalendarWeekdays: LEAVE_CALENDAR_WEEKDAYS_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /attendanceNotePresets: ATTENDANCE_NOTE_PRESETS_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /checkOutNow: isKoLocale \? "퇴근 처리\(지금\)" : "Check-out now"/);
  assert.match(employeeLocaleHelpers, /ko: \["일", "월", "화", "수", "목", "금", "토"\]/);
  assert.match(employeeLocaleHelpers, /en: \["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"\]/);

  assert.match(workItem, /WI-0314/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0314/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0314-employee-locale-dynamic-ui-gap-fix-phase4-and-locale-helper-split.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
