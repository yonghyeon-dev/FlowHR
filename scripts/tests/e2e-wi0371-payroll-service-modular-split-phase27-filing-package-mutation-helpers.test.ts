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
    "service-year-end-filing-package-mutation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0371-payroll-service-modular-split-phase27-filing-package-mutation-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /acknowledgePayrollYearEndFilingPackageFromHelper/);
  assert.match(helperSource, /cancelPayrollYearEndFilingPackageFromHelper/);
  assert.match(helperSource, /reopenPayrollYearEndFilingPackageFromHelper/);
  assert.match(helperSource, /payroll\.year_end\.filing_package_acknowledged/);
  assert.match(helperSource, /payroll\.year_end\.filing_package_canceled/);
  assert.match(helperSource, /payroll\.year_end\.filing_package_reopened/);

  assert.match(payrollService, /return acknowledgePayrollYearEndFilingPackageFromHelper\(context, input\);/);
  assert.match(payrollService, /return cancelPayrollYearEndFilingPackageFromHelper\(context, input\);/);
  assert.match(payrollService, /return reopenPayrollYearEndFilingPackageFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.filing_package_acknowledged/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.filing_package_canceled/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.filing_package_reopened/);

  assert.match(workItem, /WI-0371/i);
  assert.match(workItem, /filing package mutation helpers/i);
  assert.match(roadmap, /WI-0371/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0371-payroll-service-modular-split-phase27-filing-package-mutation-helpers.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
