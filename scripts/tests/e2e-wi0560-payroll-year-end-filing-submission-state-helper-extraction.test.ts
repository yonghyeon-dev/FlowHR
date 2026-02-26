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
    "submission-state-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0560-payroll-year-end-filing-submission-state-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export function upsertSubmissionAtTop/);
  assert.match(helpers, /export function replaceSubmissionById/);
  assert.match(helpers, /export function buildActiveSubmissionFiltersSummary/);

  assert.match(consoleSource, /from "@\/components\/payroll-year-end-filing\/submission-state-helpers"/);
  assert.match(consoleSource, /buildActiveSubmissionFiltersSummary\(/);
  assert.match(consoleSource, /upsertSubmissionAtTop\(/);
  assert.match(consoleSource, /replaceSubmissionById\(/);
  assert.match(consoleSource, /<strong>\{activeSubmissionFiltersSummary\}<\/strong>/);

  assert.match(workItem, /WI-0560/i);
  assert.match(workItem, /filing|submission|state|helper|extraction/i);
  assert.match(roadmap, /WI-0560/i);
}

run()
  .then(() => {
    console.log("e2e-wi0560-payroll-year-end-filing-submission-state-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
