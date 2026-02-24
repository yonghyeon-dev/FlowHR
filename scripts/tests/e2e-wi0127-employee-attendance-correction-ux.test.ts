import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePageSource = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");

  assert.match(
    employeePageSource,
    /정정 대상 기록 선택|Select correction target record/,
    "employee attendance panel should provide correction target selector"
  );
  assert.match(
    employeePageSource,
    /선택 기록 불러오기|Load selected record/,
    "employee attendance panel should provide selected-record prefill action"
  );
  assert.match(
    employeePageSource,
    /근무시간 변화|Work-time delta/,
    "employee attendance panel should show correction delta preview"
  );
  assert.match(
    employeePageSource,
    /attendanceNotePresets\.map\(\(preset\) => \(/,
    "employee attendance panel should render locale-aware note preset shortcuts"
  );
  assert.match(
    employeeLocaleHelpers,
    /퇴근 누락 정정/,
    "employee attendance panel should provide note preset shortcuts"
  );
  assert.match(employeeLocaleHelpers, /Missed checkout correction/);
}

run();
console.log("e2e-wi0127-employee-attendance-correction-ux.test passed");
