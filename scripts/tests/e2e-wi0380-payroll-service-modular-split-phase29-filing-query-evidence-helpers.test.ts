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
    "service-year-end-filing-query-evidence-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0380-payroll-service-modular-split-phase29-filing-query-evidence-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helperSource, /listPayrollYearEndFilingSubmissionsFromHelper/);
  assert.match(helperSource, /listPayrollYearEndFilingAckCatalogFromHelper/);
  assert.match(helperSource, /listPayrollYearEndFilingSubmissionTimelineFromHelper/);
  assert.match(helperSource, /addPayrollYearEndFilingEvidenceNoteFromHelper/);
  assert.match(helperSource, /payroll\.year_end\.filing_evidence_note_added/);

  assert.match(payrollService, /return listPayrollYearEndFilingSubmissionsFromHelper\(context, input\);/);
  assert.match(payrollService, /return listPayrollYearEndFilingAckCatalogFromHelper\(context\);/);
  assert.match(payrollService, /return listPayrollYearEndFilingSubmissionTimelineFromHelper\(context, input\);/);
  assert.match(payrollService, /return addPayrollYearEndFilingEvidenceNoteFromHelper\(context, input\);/);
  assert.doesNotMatch(payrollService, /payroll\.year_end\.filing_evidence_note_added/);
  assert.doesNotMatch(payrollService, /buildYearEndFilingSubmissionTimeline\(logs, input\.submissionId\)/);

  assert.match(workItem, /WI-0380/i);
  assert.match(workItem, /filing query evidence helpers/i);
  assert.match(roadmap, /WI-0380/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0380-payroll-service-modular-split-phase29-filing-query-evidence-helpers.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
