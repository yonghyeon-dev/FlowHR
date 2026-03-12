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
  const filingApiLogsPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingApiLogsPanel.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1194-admin-payroll-filing-side-rail-priority-follow-up.md"
  );

  assert.match(filingConsole, /v2-workspace-split/);
  assert.match(filingConsole, /v2-workspace-main/);
  assert.match(filingConsole, /v2-workspace-side/);
  assert.match(filingConsole, /Priority supporting panels/);

  const summaryIndex = filingConsole.indexOf("<FilingSettlementSummaryPanels");
  const blockersIndex = filingConsole.indexOf("<FilingPreflightBlockerPanel");
  const failureIndex = filingConsole.indexOf("<FilingFailureActionPanel");
  const logsIndex = filingConsole.indexOf("<FilingApiLogsPanel");

  assert.ok(summaryIndex > -1, "settlement summary panels should be present");
  assert.ok(blockersIndex > summaryIndex, "preflight blockers should follow settlement summary");
  assert.ok(failureIndex > blockersIndex, "failure follow-up should follow blockers");
  assert.ok(logsIndex > failureIndex, "diagnostic logs should trail recovery panels");

  assert.match(filingApiLogsPanel, /workspace-note-card v2-surface-card/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1194-admin-payroll-filing-side-rail-priority-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1194/);
}

run();
console.log("e2e-wi1194-admin-payroll-filing-side-rail-priority-follow-up.test passed");
