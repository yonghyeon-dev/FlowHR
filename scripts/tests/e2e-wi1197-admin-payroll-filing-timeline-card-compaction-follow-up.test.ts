import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const timelinePanel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSubmissionTimelinePanel.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1197-admin-payroll-filing-timeline-card-compaction-follow-up.md"
  );

  assert.match(timelinePanel, /admin-payroll-timeline-card/);
  assert.match(timelinePanel, /admin-payroll-timeline-eyebrow/);
  assert.match(timelinePanel, /admin-payroll-timeline-list/);
  assert.match(timelinePanel, /admin-payroll-timeline-item/);
  assert.match(timelinePanel, /admin-payroll-timeline-item-head/);
  assert.match(timelinePanel, /admin-payroll-timeline-item-copy/);
  assert.match(timelinePanel, /Follow-up stream|후속 스트림/);

  assert.match(globalsCss, /\.admin-payroll-timeline-card \{/);
  assert.match(globalsCss, /\.admin-payroll-timeline-list \{/);
  assert.match(globalsCss, /\.admin-payroll-timeline-item \{/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1197-admin-payroll-filing-timeline-card-compaction-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1197`/);
  assert.match(workItem, /WI-1197/);
}

run();
console.log("e2e-wi1197-admin-payroll-filing-timeline-card-compaction-follow-up.test passed");
