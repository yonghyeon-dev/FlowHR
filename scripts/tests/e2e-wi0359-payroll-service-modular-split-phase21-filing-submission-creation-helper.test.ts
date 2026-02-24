import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const filingSubmissionHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-filing-submission-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0359-payroll-service-modular-split-phase21-filing-submission-creation-helper.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(filingSubmissionHelpers, /createYearEndFilingSubmissionFromHelper/);
  assert.match(filingSubmissionHelpers, /buildYearEndFilingSubmissionId/);
  assert.match(filingSubmissionHelpers, /exportYearEndFilingData/);

  assert.match(payrollService, /createYearEndFilingSubmissionFromHelper\(/);
  assert.doesNotMatch(payrollService, /async function createYearEndFilingSubmission\(/);

  assert.match(workItem, /WI-0359/i);
  assert.match(workItem, /filing submission/i);
  assert.match(roadmap, /WI-0359/i);
}

run()
  .then(() => {
    console.log("e2e-wi0359-payroll-service-modular-split-phase21-filing-submission-creation-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
