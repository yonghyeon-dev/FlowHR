import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const reportingHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-reporting-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0357-payroll-service-modular-split-phase19-year-end-reporting-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(reportingHelpers, /getPayrollYearEndInsuranceReconciliationReportFromHelper/);
  assert.match(reportingHelpers, /getPayrollYearEndPreflightChecklistFromHelper/);

  assert.match(
    payrollService,
    /return await getPayrollYearEndInsuranceReconciliationReportFromHelper\(context, input\);/
  );
  assert.match(
    payrollService,
    /return await getPayrollYearEndPreflightChecklistFromHelper\(context, input\);/
  );

  assert.match(workItem, /WI-0357/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0357/i);
}

run()
  .then(() => {
    console.log("e2e-wi0357-payroll-service-modular-split-phase19-year-end-reporting-helpers.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
