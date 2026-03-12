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
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1199-admin-payroll-filing-setup-card-compaction-follow-up.md"
  );

  assert.match(filingConsole, /admin-payroll-setup-card/);
  assert.match(filingConsole, /Operator form|운영 입력 폼/);
  assert.match(filingConsole, /consoleTopStageGrid/);
  assert.match(filingConsole, /consoleFieldSectionCard/);
  assert.match(filingConsole, /consoleDenseInputGrid/);
  assert.match(filingConsole, /consoleActionInputGrid/);

  assert.match(filingStyles, /\.consoleTopStageGrid \{/);
  assert.match(filingStyles, /\.consoleFieldSectionCard \{/);
  assert.match(filingStyles, /\.consoleDenseInputGrid \{/);
  assert.match(filingStyles, /\.consoleActionInputGrid \{/);
  assert.match(filingStyles, /\.consoleCardEyebrow \{/);

  assert.match(globalsCss, /\.admin-payroll-setup-card \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1199-admin-payroll-filing-setup-card-compaction-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1199`/);
  assert.match(workItem, /WI-1199/);
}

run();
console.log("e2e-wi1199-admin-payroll-filing-setup-card-compaction-follow-up.test passed");
