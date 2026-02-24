import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeDerivedHelpers = readUtf8("src", "app", "employee", "page-derived-helpers.ts");
  const employeeSummarySources = `${employeePage}\n${employeeDerivedHelpers}`;
  const employeeLocaleHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0324-employee-locale-summary-copy-split-phase10.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /summaryCopy/);
  assert.match(employeePage, /const \{ leaveBalance: leaveBalanceCopy, leaveUnits: leaveUnitCopy \} = summaryCopy;/);
  assert.match(employeePage, /return leaveBalanceCopy\.notLoaded;/);
  assert.match(employeePage, /return leaveBalanceCopy\.summary\(/);
  assert.match(employeeSummarySources, /label: leaveBalanceCopy\.cardLabels\.remaining/);
  assert.match(employeeSummarySources, /leaveBalanceCopy\.projectedRemaining/);
  assert.match(employeeSummarySources, /leaveUnitCopy\.hourUnit\(request\.hours\.toFixed\(2\)\)/);
  assert.match(employeePage, /leaveBalanceLabel=\{leaveBalance \? leaveBalanceCopy\.dayUnit\(/);

  assert.doesNotMatch(employeePage, /잔여 휴가 정보를 아직 불러오지 못했습니다\./);
  assert.doesNotMatch(employeePage, /현재 사용 속도 기준 연말 예상 잔여/);
  assert.doesNotMatch(employeePage, /\\$\\{request\\.hours\\.toFixed\\(2\\)\\}시간/);
  assert.doesNotMatch(employeePage, /\\$\\{formatDays\\(request\\.days\\)\\}일/);

  assert.match(employeeLocaleHelpers, /const EMPLOYEE_SUMMARY_COPY_BY_LOCALE =/);
  assert.match(employeeLocaleHelpers, /summaryCopy: EMPLOYEE_SUMMARY_COPY_BY_LOCALE\[localeKey\]/);
  assert.match(employeeLocaleHelpers, /leaveBalance: \{/);
  assert.match(employeeLocaleHelpers, /leaveUnits: \{/);

  assert.match(workItem, /WI-0324/i);
  assert.match(workItem, /locale/i);
  assert.match(workItem, /summary/i);
  assert.match(roadmap, /WI-0324/i);
}

run()
  .then(() => {
    console.log("e2e-wi0324-employee-locale-summary-copy-split-phase10.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
