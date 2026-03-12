import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const feedbackPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeRequestFeedbackPanels.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1166-employee-requests-monitoring-density-follow-up.md"
  );

  assert.match(feedbackPanels, /employee-request-monitoring-summary-grid/);
  assert.match(feedbackPanels, /employee-request-monitoring-summary-card/);
  assert.match(feedbackPanels, /employee-request-monitoring-panel-head/);
  assert.match(feedbackPanels, /pendingSearchRows/);
  assert.match(
    feedbackPanels,
    /\uC0C1\uD0DC \uC810\uAC80|Status review/
  );
  assert.match(
    feedbackPanels,
    /\uD6C4\uC18D \uB300\uC0C1 \uCC3E\uAE30|Find follow-up work/
  );

  assert.match(globalsCss, /\.employee-request-monitoring-summary-grid \{/);
  assert.match(globalsCss, /\.employee-request-monitoring-summary-card \{/);
  assert.match(globalsCss, /\.employee-request-monitoring-panel-head \{/);

  assert.match(workItem, /WI-1166/);
  assert.match(workItem, /monitoring density follow-up/i);
}

run();
console.log("e2e-wi1166-employee-requests-monitoring-density-follow-up.test passed");
