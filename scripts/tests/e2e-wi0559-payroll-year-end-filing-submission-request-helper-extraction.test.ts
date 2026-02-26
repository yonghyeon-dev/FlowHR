import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const helpers = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "submission-request-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0559-payroll-year-end-filing-submission-request-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export function buildFilingSubmissionListQuery/);
  assert.match(helpers, /export function buildAcknowledgeSubmissionPayload/);
  assert.match(helpers, /export function buildResubmitSubmissionPayload/);
  assert.match(helpers, /export function buildSubmitFilingPackagePayload/);

  assert.match(consoleSource, /from "@\/components\/payroll-year-end-filing\/submission-request-helpers"/);
  assert.match(consoleSource, /buildFilingSubmissionListQuery\(/);
  assert.match(consoleSource, /buildAcknowledgeSubmissionPayload\(/);
  assert.match(consoleSource, /buildResubmitSubmissionPayload\(/);
  assert.match(consoleSource, /buildSubmitFilingPackagePayload\(/);

  assert.match(workItem, /WI-0559/i);
  assert.match(workItem, /filing|submission|request|helper|extraction/i);
  assert.match(roadmap, /WI-0559/i);
}

run()
  .then(() => {
    console.log("e2e-wi0559-payroll-year-end-filing-submission-request-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
