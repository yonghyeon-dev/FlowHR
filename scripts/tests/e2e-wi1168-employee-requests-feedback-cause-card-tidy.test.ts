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
    "WI-1168-employee-requests-feedback-cause-card-tidy.md"
  );

  assert.match(feedbackPanels, /employee-request-feedback-card/);
  assert.match(feedbackPanels, /employee-request-feedback-title/);
  assert.match(feedbackPanels, /employee-request-feedback-message/);
  assert.match(feedbackPanels, /employee-request-failure-card/);
  assert.match(feedbackPanels, /employee-request-failure-title/);
  assert.match(feedbackPanels, /employee-request-failure-actions/);
  assert.match(feedbackPanels, /\uC2E4\uD328 \uC6D0\uC778|Failure cause/);

  assert.match(globalsCss, /\.employee-request-feedback-card \{/);
  assert.match(globalsCss, /\.employee-request-feedback-title \{/);
  assert.match(globalsCss, /\.employee-request-failure-card \{/);
  assert.match(globalsCss, /\.employee-request-failure-title \{/);
  assert.match(globalsCss, /\.employee-request-monitoring-empty \{/);

  assert.match(workItem, /WI-1168/);
  assert.match(workItem, /feedback cause card tidy/i);
}

run();
console.log("e2e-wi1168-employee-requests-feedback-cause-card-tidy.test passed");
