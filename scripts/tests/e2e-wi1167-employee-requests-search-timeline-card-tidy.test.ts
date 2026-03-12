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
    "WI-1167-employee-requests-search-timeline-card-tidy.md"
  );

  assert.match(feedbackPanels, /employee-request-search-card/);
  assert.match(feedbackPanels, /employee-request-search-title/);
  assert.match(feedbackPanels, /employee-request-search-summary/);
  assert.match(feedbackPanels, /employee-request-timeline-card/);
  assert.match(feedbackPanels, /employee-request-timeline-title/);
  assert.match(
    feedbackPanels,
    /\uADFC\uD0DC \uC694\uCCAD|Attendance request/
  );

  assert.match(globalsCss, /\.employee-request-search-card \{/);
  assert.match(globalsCss, /\.employee-request-search-title \{/);
  assert.match(globalsCss, /\.employee-request-timeline-card \{/);
  assert.match(globalsCss, /\.employee-request-timeline-title \{/);

  assert.match(workItem, /WI-1167/);
  assert.match(workItem, /search timeline card tidy/i);
}

run();
console.log("e2e-wi1167-employee-requests-search-timeline-card-tidy.test passed");
