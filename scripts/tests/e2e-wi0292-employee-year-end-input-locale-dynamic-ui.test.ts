import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8("src", "components", "payroll-year-end", "EmployeeYearEndInputConsole.tsx");
  const copySource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "employee-year-end-input-copy.ts"
  );
  const workItem = readUtf8("work-items", "WI-0292-employee-year-end-input-locale-dynamic-ui.md");

  assert.match(consoleSource, /useI18n\(\)/);
  assert.match(copySource, /employeeYearEndInputCopyByLocale: Record<FlowLocale, EmployeeYearEndInputCopy>/);
  assert.match(copySource, /ko:\s*\{/);
  assert.match(copySource, /en:\s*\{/);
  assert.match(copySource, /ko:\s*\{[\s\S]*title:\s*"[^"]+"/);
  assert.match(copySource, /title:\s*"Year-End Input Simulator"/);
  assert.match(consoleSource, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(consoleSource, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(consoleSource, /copy\.loadFinalizedSettlementAction/);
  assert.match(consoleSource, /copy\.apiLogsTitle/);
  assert.match(consoleSource, /copy\.openWithholdingReceiptAction/);

  assert.match(workItem, /WI-0292/i);
  assert.match(workItem, /釉뚮씪?곗? ?몄뼱|locale/i);
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
