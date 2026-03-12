import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filingStyles = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingWorkflow.module.css"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1203-admin-payroll-filing-mobile-density-follow-up.md"
  );

  assert.match(filingStyles, /@media \(max-width: 720px\)/);
  assert.match(filingStyles, /\.consoleDigestGrid/);
  assert.match(filingStyles, /\.consoleFeedbackRail/);
  assert.match(globalsCss, /@media \(max-width: 720px\)/);
  assert.match(globalsCss, /\.admin-payroll-submissions-summary/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1203-admin-payroll-filing-mobile-density-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1203`/);
  assert.match(workItem, /WI-1203/);
}

run();
console.log("e2e-wi1203-admin-payroll-filing-mobile-density-follow-up.test passed");
