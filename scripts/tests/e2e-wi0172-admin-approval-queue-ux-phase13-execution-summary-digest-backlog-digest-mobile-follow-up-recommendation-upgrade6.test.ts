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
    /queueHistoryExecutionSummaryDigestCards/,
    "admin page should compute queue history execution summary digest cards"
  );
  assert.match(
    adminPage,
    /queueDelayExecutionBacklogDigestCards/,
    "admin page should compute queue delay execution backlog digest cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpRecommendationUpgrade6Cards/,
    "admin page should compute queue mobile follow-up recommendation upgrade 6 cards"
  );
  assert.match(
    adminPage,
    /runQueueHistoryExecutionSummaryDigestAction/,
    "admin page should expose history execution summary digest action handler"
  );
  assert.match(
    adminPage,
    /runQueueDelayExecutionBacklogDigestAction/,
    "admin page should expose delay execution backlog digest action handler"
  );
  assert.match(
    adminPage,
    /runQueueMobileFollowUpRecommendationUpgrade6Action/,
    "admin page should expose recommendation upgrade 6 action handler"
  );

  assert.match(
    adminPage,
    /id="approval-history-execution-summary-digest"/,
    "admin page should expose history execution summary digest section"
  );
  assert.match(
    adminPage,
    /id="approval-delay-execution-backlog-digest"/,
    "admin page should expose delay execution backlog digest section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-recommendation-upgrade-6"/,
    "admin page should expose mobile follow-up recommendation upgrade 6 section"
  );

  assert.match(
    adminPage,
    /aria-label="approval history execution summary digest list"/,
    "admin page should render history execution summary digest list"
  );
  assert.match(
    adminPage,
    /aria-label="approval delay execution backlog digest list"/,
    "admin page should render delay execution backlog digest list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up recommendation upgrade 6 list"/,
    "admin page should render mobile recommendation upgrade 6 list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-history-execution-summary-digest/,
    "admin nav should include history execution summary digest anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-delay-execution-backlog-digest/,
    "admin nav should include delay execution backlog digest anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-recommendation-upgrade-6/,
    "admin nav should include mobile recommendation upgrade 6 anchor"
  );

  assert.match(
    globalCss,
    /\.queue-history-execution-summary-digest-panel/,
    "history execution summary digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-history-execution-summary-digest-list/,
    "history execution summary digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-execution-backlog-digest-panel/,
    "delay execution backlog digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-execution-backlog-digest-list/,
    "delay execution backlog digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-6-panel/,
    "mobile follow-up recommendation upgrade 6 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-6-list/,
    "mobile follow-up recommendation upgrade 6 list style should exist"
  );

  assert.match(
    globalCss,
    /#approvals \.queue-history-execution-summary-digest-list/,
    "responsive rule for history execution summary digest list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-delay-execution-backlog-digest-list/,
    "responsive rule for delay execution backlog digest list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-recommendation-upgrade-6-list/,
    "responsive rule for mobile recommendation upgrade 6 list should exist"
  );
}

run();
console.log(
  "e2e-wi0172-admin-approval-queue-ux-phase13-execution-summary-digest-backlog-digest-mobile-follow-up-recommendation-upgrade6.test passed"
);
