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
  const copy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const feedbackHelpers = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "request-feedback-helpers.ts"
  );
  const failurePanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingFailureActionPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0599-admin-payroll-year-end-filing-failure-action-ux-hardening.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copy, /failureActionPanelTitle:/);
  assert.match(copy, /retryFailureAction:/);
  assert.match(copy, /clearFailureAction:/);

  assert.match(feedbackHelpers, /export function appendApiLogEntry/);
  assert.match(feedbackHelpers, /export function extractApiErrorMessage/);
  assert.match(feedbackHelpers, /export function buildRequestFailureStatusMessage/);
  assert.match(feedbackHelpers, /export type PayrollYearEndFilingFailureState/);

  assert.match(consoleSource, /from "@\/components\/payroll-year-end-filing\/request-feedback-helpers"/);
  assert.match(consoleSource, /from "@\/components\/payroll-year-end-filing\/FilingFailureActionPanel"/);
  assert.match(consoleSource, /const \[lastFailure, setLastFailure\] = useState/);
  assert.match(consoleSource, /function recordFailure\(/);
  assert.match(consoleSource, /async function retryLastFailureAction\(/);
  assert.match(consoleSource, /<FilingFailureActionPanel/);

  assert.match(failurePanel, /copy\.failureActionPanelTitle/);
  assert.match(failurePanel, /copy\.retryFailureAction/);
  assert.match(failurePanel, /copy\.clearFailureAction/);

  assert.ok(
    countLines(consoleSource) <= 1300,
    `PayrollYearEndFilingConsole.tsx should stay <= 1300 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(workItem, /WI-0599/i);
  assert.match(workItem, /payroll|year-end|filing|failure|action|ux|hardening/i);
  assert.match(roadmap, /WI-0599/i);
}

run()
  .then(() => {
    console.log("e2e-wi0599-admin-payroll-year-end-filing-failure-action-ux-hardening.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
