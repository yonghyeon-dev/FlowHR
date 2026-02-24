import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const lifecycleHelper = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-filing-submission-lifecycle-helpers.ts"
  );
  const workItem = readUtf8("work-items", "WI-0308-payroll-service-modular-split-phase7.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payrollService,
    /from "@\/features\/payroll\/year-end-filing-submission-lifecycle-helpers"/
  );
  assert.match(payrollService, /async function listYearEndFilingSubmissionSummaries\(/);
  assert.match(payrollService, /return buildYearEndFilingSubmissionSummariesCore\(logs\) as PayrollYearEndFilingSubmissionSummary\[\];/);
  assert.match(payrollService, /async function listYearEndFilingLifecycleLogs\(/);
  assert.match(payrollService, /return listYearEndFilingLifecycleLogsCore\(context\.dataAccess\.audit, input\);/);
  assert.match(payrollService, /ensureNoPendingFilingSubmissionCore\(submissions\);/);
  assert.match(payrollService, /return buildYearEndFilingSubmissionIdCore\(input\);/);

  assert.match(lifecycleHelper, /export async function listYearEndFilingLifecycleLogs\(/);
  assert.match(lifecycleHelper, /export async function listYearEndFilingSubmissionSummaries/);
  assert.match(lifecycleHelper, /export function ensureNoPendingFilingSubmission/);
  assert.match(lifecycleHelper, /export function buildYearEndFilingSubmissionId/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 4866,
    `expected payroll service line count to decrease below 4866, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0308/i);
  assert.match(workItem, /modular split|decomposition/i);
  assert.match(roadmap, /WI-0308/i);
}

run()
  .then(() => {
    console.log("e2e-wi0308-payroll-service-modular-split-phase7.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
