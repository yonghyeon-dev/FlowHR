import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const compensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-1134-admin-payroll-dashboard-dead-props-prune.md"
  );

  assert.doesNotMatch(panels, /onPreviewPayroll=\{\(\) => void dashboardActions\.previewPayroll\(\)\}/);
  assert.doesNotMatch(
    panels,
    /onConfirmPayroll=\{\(\) => void dashboardActions\.confirmPayroll\(pageState\.lastPayrollRunId\)\}/
  );
  assert.doesNotMatch(panels, /onResetPayrollPresetShareContext=/);
  assert.doesNotMatch(panels, /onReapplyPayrollPresetShareContext=/);
  assert.doesNotMatch(panels, /onClearManualIncomeSplitItems=/);

  assert.doesNotMatch(compensationPanels, /payrollPreviewMode:/);
  assert.doesNotMatch(compensationPanels, /payrollPresetShareLinkFeedback:/);
  assert.doesNotMatch(compensationPanels, /onPreviewPayroll:/);
  assert.doesNotMatch(compensationPanels, /onConfirmPayroll:/);
  assert.doesNotMatch(compensationPanels, /onResetPayrollPresetShareContext:/);
  assert.doesNotMatch(compensationPanels, /onReapplyPayrollPresetShareContext:/);
  assert.doesNotMatch(compensationPanels, /onClearManualIncomeSplitItems:/);

  assert.match(workItem, /WI-1134/i);
  assert.match(workItem, /dead props/i);
}

run()
  .then(() => {
    console.log("e2e-wi1134-admin-payroll-dashboard-dead-props-prune.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
