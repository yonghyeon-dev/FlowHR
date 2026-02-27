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
  const helpers = readUtf8("src", "components", "payroll-year-end-filing", "value-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0558-payroll-year-end-filing-value-helper-extraction-and-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(helpers, /export function parseRequiredInt/);
  assert.match(helpers, /export function parseRate/);
  assert.match(helpers, /export function formatTimelineEntry/);

  assert.match(consoleSource, /from "@\/components\/payroll-year-end-filing\/value-helpers"/);
  assert.match(consoleSource, /parseRequiredInt\(/);
  assert.match(consoleSource, /parseRate\(/);
  assert.match(consoleSource, /formatTimelineEntry\(/);

  assert.doesNotMatch(consoleSource, /function parseRequiredInt\(/);
  assert.doesNotMatch(consoleSource, /function parseRate\(/);
  assert.doesNotMatch(consoleSource, /function formatTimelineEntry\(/);

  assert.ok(
    countLines(consoleSource) <= 1300,
    `PayrollYearEndFilingConsole.tsx should stay <= 1300 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(workItem, /WI-0558/i);
  assert.match(workItem, /filing|value|helper|extraction|line-budget|recovery/i);
  assert.match(roadmap, /WI-0558/i);
}

run()
  .then(() => {
    console.log("e2e-wi0558-payroll-year-end-filing-value-helper-extraction-and-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
