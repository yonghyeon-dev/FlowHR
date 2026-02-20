import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePageSource = readUtf8("src", "app", "employee", "page.tsx");

  assert.match(
    employeePageSource,
    /정정 대상 기록 선택/,
    "employee attendance panel should provide correction target selector"
  );
  assert.match(
    employeePageSource,
    /선택 기록 불러오기/,
    "employee attendance panel should provide selected-record prefill action"
  );
  assert.match(
    employeePageSource,
    /근무시간 변화:/,
    "employee attendance panel should show correction delta preview"
  );
  assert.match(
    employeePageSource,
    /퇴근 누락 정정/,
    "employee attendance panel should provide note preset shortcuts"
  );
}

run();
console.log("e2e-wi0127-employee-attendance-correction-ux.test passed");
