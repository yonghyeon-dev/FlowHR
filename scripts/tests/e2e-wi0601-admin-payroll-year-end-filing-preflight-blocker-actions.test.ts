import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const preflightPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const feedbackHelpers = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "request-feedback-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0601-admin-payroll-year-end-filing-preflight-blocker-actions.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(feedbackHelpers, /\| "preflight_checklist"/);

  assert.match(consoleSource, /\[preflightChecklist,\s*setPreflightChecklist\]/);
  assert.match(consoleSource, /async function runLoadPreflightChecklist\(/);
  assert.match(consoleSource, /function runOpenPendingSubmissionsFromPreflight\(/);
  assert.match(consoleSource, /<FilingPreflightBlockerPanel/);
  assert.match(consoleSource, /case "preflight_checklist": return runLoadPreflightChecklist\(\)/);

  assert.match(preflightPanel, /no_pending_filing_submissions/);
  assert.match(preflightPanel, /non_taxable_within_annual_gross/);
  assert.match(preflightPanel, /\/admin\/payroll-year-end\/preflight/);

  assert.ok(
    countLines(consoleSource) <= 1300,
    `PayrollYearEndFilingConsole.tsx should stay <= 1300 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(workItem, /WI-0601/i);
  assert.match(workItem, /preflight|blocker|year-end|filing/i);
  assert.match(roadmap, /WI-0601/i);
}

run()
  .then(() => {
    console.log("e2e-wi0601-admin-payroll-year-end-filing-preflight-blocker-actions.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
