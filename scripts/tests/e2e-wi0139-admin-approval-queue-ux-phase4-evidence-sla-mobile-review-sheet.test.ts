import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    adminPage,
    /queueEvidencePreviewCards/,
    "admin page should compute approval evidence preview cards"
  );
  assert.match(adminPage, /queueSlaTimelinePoints/, "admin page should compute queue SLA timeline points");
  assert.match(adminPage, /mobileBulkReviewSteps/, "admin page should compute mobile bulk review sheet model");
  assert.match(adminPage, /id="approval-evidence-preview"/, "admin page should expose evidence preview section");
  assert.match(adminPage, /id="approval-sla-timeline"/, "admin page should expose SLA timeline section");
  assert.match(
    adminPage,
    /id="approval-mobile-review-sheet"/,
    "admin page should expose mobile review sheet section"
  );
  assert.match(
    adminPage,
    /aria-label="approval evidence preview cards"/,
    "admin page should render evidence preview list"
  );
  assert.match(
    adminPage,
    /aria-label="approval queue sla timeline"/,
    "admin page should render SLA timeline list"
  );
  assert.match(
    adminPage,
    /aria-label="mobile bulk review sheet"/,
    "admin page should render mobile review sheet"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-evidence-preview/,
    "admin nav should include approval evidence preview anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-sla-timeline/,
    "admin nav should include approval SLA timeline anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-review-sheet/,
    "admin nav should include approval mobile review sheet anchor"
  );

  assert.match(globalCss, /\.queue-evidence-preview-panel/, "evidence preview panel style should exist");
  assert.match(globalCss, /\.queue-evidence-preview-list/, "evidence preview list style should exist");
  assert.match(globalCss, /\.queue-sla-timeline-panel/, "SLA timeline panel style should exist");
  assert.match(globalCss, /\.queue-sla-timeline-list/, "SLA timeline list style should exist");
  assert.match(globalCss, /\.queue-mobile-review-sheet/, "mobile review sheet style should exist");
  assert.match(globalCss, /\.queue-mobile-review-grid/, "mobile review grid style should exist");
  assert.match(
    globalCss,
    /#approvals \.queue-evidence-preview-list/,
    "mobile rule for evidence preview list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-review-grid/,
    "mobile rule for mobile review grid should exist"
  );
}

run();
console.log("e2e-wi0139-admin-approval-queue-ux-phase4-evidence-sla-mobile-review-sheet.test passed");
