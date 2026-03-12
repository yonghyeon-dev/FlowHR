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
  const filingSummaryPanels = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSettlementSummaryPanels.tsx"
  );
  const filingPreflightPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const filingFailurePanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingFailureActionPanel.tsx"
  );
  const filingTimelinePanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSubmissionTimelinePanel.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1193-admin-payroll-filing-workspace-density-follow-up.md"
  );

  assert.match(filingConsole, /RouteWorkspaceShell/);
  assert.match(filingConsole, /RouteWorkspaceStatus/);
  assert.match(filingConsole, /setupDigestItems/);
  assert.match(filingConsole, /consoleFieldSection/);
  assert.match(filingConsole, /consoleActionStack/);
  assert.match(filingConsole, /Primary flow/);
  assert.match(filingConsole, /Response and recovery/);
  assert.match(filingConsole, /Supporting checks/);
  assert.match(filingConsole, /workspace-toolbar-card v2-surface-card/);

  assert.match(filingStyles, /\.consoleDigestGrid/);
  assert.match(filingStyles, /\.consoleFieldSection/);
  assert.match(filingStyles, /\.consoleActionStack/);
  assert.match(filingStyles, /\.consoleFeedbackStack/);

  assert.match(filingSummaryPanels, /workspace-note-card v2-surface-card/);
  assert.match(filingPreflightPanel, /workspace-note-card v2-surface-card/);
  assert.match(filingFailurePanel, /workspace-note-card v2-surface-card/);
  assert.match(filingTimelinePanel, /workspace-note-card v2-surface-card/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1193-admin-payroll-filing-workspace-density-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1193/);
}

run();
console.log("e2e-wi1193-admin-payroll-filing-workspace-density-follow-up.test passed");
