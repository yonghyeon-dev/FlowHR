import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const payrollAdapterHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-adapter-helpers.ts"
  );
  const lifecycleHelpers = readUtf8("src", "features", "payroll", "year-end-filing-lifecycle-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0302-payroll-service-modular-split-phase4.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/service-year-end-adapter-helpers"/);
  assert.match(payrollAdapterHelpers, /from "@\/features\/payroll\/year-end-filing-lifecycle-helpers"/);
  assert.match(
    payrollAdapterHelpers,
    /return buildYearEndFilingSubmissionSummariesCore\(logs\) as PayrollYearEndFilingSubmissionSummary\[\];/
  );
  assert.match(
    payrollAdapterHelpers,
    /return buildYearEndFilingSubmissionTimelineCore\([\s\S]*submissionId[\s\S]*\) as PayrollYearEndFilingTimelineEntry\[\];/
  );

  assert.doesNotMatch(payrollService, /function buildYearEndFilingSubmissionSummaries\(/);
  assert.doesNotMatch(payrollService, /function buildYearEndFilingSubmissionTimeline\(/);

  assert.match(lifecycleHelpers, /export function buildYearEndFilingSubmissionSummaries\(/);
  assert.match(lifecycleHelpers, /export function buildYearEndFilingSubmissionTimeline\(/);
  assert.match(lifecycleHelpers, /asYearEndFilingPackageSubmittedAuditPayload/);
  assert.match(lifecycleHelpers, /asYearEndFilingPackageAcknowledgedAuditPayload/);
  assert.match(lifecycleHelpers, /asYearEndFilingPackageCanceledAuditPayload/);
  assert.match(lifecycleHelpers, /asYearEndFilingPackageReopenedAuditPayload/);
  assert.match(lifecycleHelpers, /asYearEndFilingEvidenceNoteAddedAuditPayload/);

  assert.match(workItem, /WI-0302/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0302/i);
}

run()
  .then(() => {
    console.log("e2e-wi0302-payroll-service-modular-split-phase4.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
