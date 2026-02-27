import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingFailureActionPanel.tsx"
  );
  const consoleFile = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0606-admin-payroll-year-end-failure-panel-context-shortcuts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /failurePanelCopyByLocale/);
  assert.match(panel, /openPreflightChecklistAction/);
  assert.match(panel, /openRejectedQueueAction/);
  assert.match(panel, /failure\.action === "preflight_checklist"/);
  assert.match(panel, /isRejectedSubmissionFailure/);
  assert.match(panel, /onOpenRejectedSubmissions/);

  assert.match(consoleFile, /locale=\{locale\}/);
  assert.match(consoleFile, /onLoadPreflightChecklist=\{\(\) => void runLoadPreflightChecklist\(\)\}/);
  assert.match(consoleFile, /onOpenRejectedSubmissions=\{runOpenRejectedSubmissionsFromPreflight\}/);

  assert.match(workItem, /WI-0606/i);
  assert.match(workItem, /failure panel|shortcut|preflight|rejected/i);
  assert.match(roadmap, /WI-0606/i);
}

run()
  .then(() => {
    console.log("e2e-wi0606-admin-payroll-year-end-failure-panel-context-shortcuts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
