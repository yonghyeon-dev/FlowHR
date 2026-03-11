import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { employeeGuideCopyByLocale } from "@/components/employee-guide/copy";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const sections = readUtf8("src", "components", "employee-guide", "EmployeeGuideSections.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1163-employee-guide-visual-density-follow-up.md"
  );

  assert.equal(employeeGuideCopyByLocale.ko.title, "직원 이용 가이드");
  assert.equal(employeeGuideCopyByLocale.ko.loadingLabel, "가이드 상태를 불러오는 중입니다...");
  assert.equal(employeeGuideCopyByLocale.ko.employeeIdLabel, "로그인된 직원 번호");
  assert.equal(employeeGuideCopyByLocale.ko.quickActionsTitle, "바로 시작할 작업");

  assert.match(sections, /employee-guide-context-grid/);
  assert.match(sections, /employee-guide-action-grid/);
  assert.match(sections, /employee-guide-checklist-card/);
  assert.match(
    sections,
    /\\uB85C\\uADF8\\uC778\\uB41C \\uC9C1\\uC6D0 \\uBC88\\uD638|Signed-in employee number/
  );

  assert.match(globalsCss, /\.employee-guide-context-grid \{/);
  assert.match(globalsCss, /\.employee-guide-action-grid \{/);
  assert.match(globalsCss, /\.employee-guide-checklist-card/);

  assert.match(workItem, /WI-1163/);
  assert.match(workItem, /visual density follow-up/i);
}

run()
  .then(() => {
    console.log("e2e-wi1163-employee-guide-visual-density-follow-up.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
