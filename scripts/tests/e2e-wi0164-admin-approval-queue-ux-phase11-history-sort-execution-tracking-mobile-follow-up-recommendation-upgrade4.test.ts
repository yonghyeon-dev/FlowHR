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
    /queueHistorySortExecutionTrackerCards/,
    "admin page should compute queue history sort execution tracker cards"
  );
  assert.match(
    adminPage,
    /queueDelayRiskExecutionBacklogCards/,
    "admin page should compute queue delay risk execution backlog cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpRecommendationUpgrade4Cards/,
    "admin page should compute queue mobile follow-up recommendation upgrade 4 cards"
  );
  assert.match(
    adminPage,
    /runQueueHistorySortExecutionTrackerAction/,
    "admin page should expose history sort execution tracker action handler"
  );
  assert.match(
    adminPage,
    /runQueueDelayRiskExecutionBacklogAction/,
    "admin page should expose delay risk execution backlog action handler"
  );
  assert.match(
    adminPage,
    /runQueueMobileFollowUpRecommendationUpgrade4Action/,
    "admin page should expose recommendation upgrade 4 action handler"
  );

  assert.match(
    adminPage,
    /id="approval-history-sort-execution-tracker"/,
    "admin page should expose history sort execution tracker section"
  );
  assert.match(
    adminPage,
    /id="approval-delay-risk-execution-backlog"/,
    "admin page should expose delay risk execution backlog section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-recommendation-upgrade-4"/,
    "admin page should expose mobile follow-up recommendation upgrade 4 section"
  );

  assert.match(
    adminPage,
    /aria-label="approval history sort execution tracker list"/,
    "admin page should render history sort execution tracker list"
  );
  assert.match(
    adminPage,
    /aria-label="approval delay risk execution backlog list"/,
    "admin page should render delay risk execution backlog list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up recommendation upgrade 4 list"/,
    "admin page should render mobile recommendation upgrade 4 list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-history-sort-execution-tracker/,
    "admin nav should include history sort execution tracker anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-delay-risk-execution-backlog/,
    "admin nav should include delay risk execution backlog anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-recommendation-upgrade-4/,
    "admin nav should include mobile recommendation upgrade 4 anchor"
  );

  assert.match(
    globalCss,
    /\.queue-history-sort-execution-tracker-panel/,
    "history sort execution tracker panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-history-sort-execution-tracker-list/,
    "history sort execution tracker list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-execution-backlog-panel/,
    "delay risk execution backlog panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-execution-backlog-list/,
    "delay risk execution backlog list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-4-panel/,
    "mobile follow-up recommendation upgrade 4 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-4-list/,
    "mobile follow-up recommendation upgrade 4 list style should exist"
  );

  assert.match(
    globalCss,
    /#approvals \.queue-history-sort-execution-tracker-list/,
    "responsive rule for history sort execution tracker list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-delay-risk-execution-backlog-list/,
    "responsive rule for delay risk execution backlog list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-recommendation-upgrade-4-list/,
    "responsive rule for mobile recommendation upgrade 4 list should exist"
  );
}

run();
console.log(
  "e2e-wi0164-admin-approval-queue-ux-phase11-history-sort-execution-tracking-mobile-follow-up-recommendation-upgrade4.test passed"
);
