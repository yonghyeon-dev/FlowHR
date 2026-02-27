import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const consoleFile = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const serviceHelper = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-reporting-helpers.ts"
  );
  const outputTypes = readUtf8("src", "features", "payroll", "service-output-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0605-admin-payroll-year-end-preflight-rejected-submission-warning-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(outputTypes, /"no_rejected_filing_submissions"/);
  assert.match(serviceHelper, /key: "no_rejected_filing_submissions"/);
  assert.match(serviceHelper, /status: rejectedSubmissionCount === 0 \? "pass" : "warn"/);

  assert.match(panel, /openRejectedSubmissionsAction:/);
  assert.match(panel, /check\.key === "no_rejected_filing_submissions"/);
  assert.match(panel, /onClick=\{onOpenRejectedSubmissions\}/);

  assert.match(consoleFile, /function runOpenRejectedSubmissionsFromPreflight\(\)/);
  assert.match(consoleFile, /setSubmissionStatusFilter\("acknowledged"\)/);
  assert.match(consoleFile, /setSubmissionAckStatusFilter\("rejected"\)/);
  assert.match(consoleFile, /onOpenRejectedSubmissions=\{runOpenRejectedSubmissionsFromPreflight\}/);

  assert.match(workItem, /WI-0605/i);
  assert.match(workItem, /rejected|warning|preflight|submission/i);
  assert.match(roadmap, /WI-0605/i);
}

run()
  .then(() => {
    console.log("e2e-wi0605-admin-payroll-year-end-preflight-rejected-submission-warning-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
