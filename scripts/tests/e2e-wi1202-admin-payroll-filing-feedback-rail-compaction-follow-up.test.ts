import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const filingStyles = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingWorkflow.module.css"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1202-admin-payroll-filing-feedback-rail-compaction-follow-up.md"
  );

  assert.match(filingConsole, /Status strip|상태 스트립/);
  assert.match(filingConsole, /consoleFeedbackRail/);
  assert.match(filingConsole, /consoleFeedbackRailEyebrow/);

  assert.match(filingStyles, /\.consoleFeedbackRail \{/);
  assert.match(filingStyles, /\.consoleFeedbackRailEyebrow \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1202-admin-payroll-filing-feedback-rail-compaction-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1202`/);
  assert.match(workItem, /WI-1202/);
}

run();
console.log("e2e-wi1202-admin-payroll-filing-feedback-rail-compaction-follow-up.test passed");
