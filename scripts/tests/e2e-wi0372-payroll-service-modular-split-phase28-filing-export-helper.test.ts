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
    "service-year-end-filing-export-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0372-payroll-service-modular-split-phase28-filing-export-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /exportPayrollYearEndFilingDataFromHelper/);
  assert.match(helperSource, /buildYearEndFilingArtifact/);
  assert.match(helperSource, /payroll\.year_end\.filing_data_exported/);
  assert.match(helperSource, /payroll\.year_end\.filing_data\.exported\.v1/);

  assert.match(payrollService, /return exportPayrollYearEndFilingDataFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.filing_data_exported/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.filing_data\.exported\.v1/);

  assert.match(workItem, /WI-0372/i);
  assert.match(workItem, /filing export helper/i);
  assert.match(roadmap, /WI-0372/i);
}

run()
  .then(() => {
    console.log("e2e-wi0372-payroll-service-modular-split-phase28-filing-export-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
