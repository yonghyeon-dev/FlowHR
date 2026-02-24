import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const helperSource = readUtf8(
    "src",
    "features",
    "payroll",
    "service-payslip-period-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0368-payroll-service-modular-split-phase24-close-period-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /closePayrollPeriodFromHelper/);
  assert.match(helperSource, /payroll\.period_close_previewed/);
  assert.match(helperSource, /payroll\.period_closed/);

  assert.match(payrollService, /return closePayrollPeriodFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.period_close_previewed/);

  assert.match(workItem, /WI-0368/i);
  assert.match(workItem, /close period/i);
  assert.match(roadmap, /WI-0368/i);
}

run()
  .then(() => {
    console.log("e2e-wi0368-payroll-service-modular-split-phase24-close-period-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
