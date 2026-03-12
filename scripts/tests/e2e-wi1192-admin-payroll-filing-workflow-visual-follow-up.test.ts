import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filingDashboard = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingDashboard.tsx"
  );
  const filingStepPanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingStepPanel.tsx"
  );
  const filingStyles = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingWorkflow.module.css"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const workItem = readUtf8(
    "work-items",
    "WI-1192-admin-payroll-filing-workflow-visual-follow-up.md"
  );

  assert.match(filingDashboard, /useI18n/);
  assert.match(filingDashboard, /isAdminPayrollSource\(source\)/);
  assert.match(filingDashboard, /filing-workflow-station-card/);
  assert.match(filingDashboard, /workspace-source-banner/);
  assert.match(filingDashboard, /digestRowActive/);

  assert.match(filingStepPanel, /useI18n/);
  assert.match(filingStepPanel, /showPayrollSource = isAdminPayrollSource\(source\)/);
  assert.match(filingStepPanel, /filing-workflow-step-card/);
  assert.match(filingStepPanel, /href="\/admin\/payroll"/);
  assert.match(filingStepPanel, /Advance in context/);
  assert.match(filingStepPanel, /stepPanelGrid/);

  assert.match(filingStyles, /\.stationHero/);
  assert.match(filingStyles, /\.stationSummaryCard/);
  assert.match(filingStyles, /\.digestRowActive/);
  assert.match(filingStyles, /\.stepPanelGrid/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1192-admin-payroll-filing-workflow-visual-follow-up\.test\.ts"/
  );
  assert.match(workItem, /WI-1192/);
}

run();
console.log("e2e-wi1192-admin-payroll-filing-workflow-visual-follow-up.test passed");
