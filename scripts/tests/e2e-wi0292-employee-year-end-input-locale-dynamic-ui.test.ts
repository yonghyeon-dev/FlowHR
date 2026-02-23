import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const source = readUtf8("src", "components", "payroll-year-end", "EmployeeYearEndInputConsole.tsx");
  const workItem = readUtf8("work-items", "WI-0292-employee-year-end-input-locale-dynamic-ui.md");

  assert.match(source, /useI18n\(\)/);
  assert.match(source, /employeeYearEndInputCopyByLocale: Record<FlowLocale, EmployeeYearEndInputCopy>/);
  assert.match(source, /ko:\s*\{/);
  assert.match(source, /en:\s*\{/);
  assert.match(source, /title:\s*"연말정산 입력 시뮬레이터"/);
  assert.match(source, /title:\s*"Year-End Input Simulator"/);
  assert.match(source, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(source, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(source, /copy\.loadFinalizedSettlementAction/);
  assert.match(source, /copy\.apiLogsTitle/);
  assert.match(source, /copy\.openWithholdingReceiptAction/);

  assert.match(workItem, /WI-0292/i);
  assert.match(workItem, /브라우저 언어|locale/i);
  assert.match(workItem, /\/employee\/year-end-input/);
}

run()
  .then(() => {
    console.log("e2e-wi0292-employee-year-end-input-locale-dynamic-ui.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

