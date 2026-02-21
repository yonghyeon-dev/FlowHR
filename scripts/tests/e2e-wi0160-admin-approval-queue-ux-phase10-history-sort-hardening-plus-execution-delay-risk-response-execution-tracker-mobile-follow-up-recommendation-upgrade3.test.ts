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
    /queueHistorySortHardeningPlusExecutionCards/,
    "admin page should compute queue history sort hardening plus execution cards"
  );
  assert.match(
    adminPage,
    /queueDelayRiskResponseExecutionTrackerCards/,
    "admin page should compute queue delay risk response execution tracker cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpRecommendationUpgrade3Cards/,
    "admin page should compute queue mobile follow-up recommendation upgrade 3 cards"
  );
  assert.match(
    adminPage,
    /runQueueHistorySortHardeningPlusExecutionAction/,
    "admin page should expose hardening plus execution action handler"
  );
  assert.match(
    adminPage,
    /runQueueDelayRiskResponseExecutionTrackerAction/,
    "admin page should expose delay risk response execution tracker action handler"
  );
  assert.match(
    adminPage,
    /runQueueMobileFollowUpRecommendationUpgrade3Action/,
    "admin page should expose recommendation upgrade 3 action handler"
  );
  assert.match(
    adminPage,
    /id="approval-history-sort-hardening-plus-execution"/,
    "admin page should expose history sort hardening plus execution section"
  );
  assert.match(
    adminPage,
    /id="approval-delay-risk-response-execution-tracker"/,
    "admin page should expose delay risk response execution tracker section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-recommendation-upgrade-3"/,
    "admin page should expose mobile follow-up recommendation upgrade 3 section"
  );
  assert.match(
    adminPage,
    /aria-label="approval history sort hardening plus execution list"/,
    "admin page should render history sort hardening plus execution list"
  );
  assert.match(
    adminPage,
    /aria-label="approval delay risk response execution tracker list"/,
    "admin page should render delay risk response execution tracker list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up recommendation upgrade 3 list"/,
    "admin page should render mobile recommendation upgrade 3 list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-history-sort-hardening-plus-execution/,
    "admin nav should include history sort hardening plus execution anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-delay-risk-response-execution-tracker/,
    "admin nav should include delay risk response execution tracker anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-recommendation-upgrade-3/,
    "admin nav should include mobile recommendation upgrade 3 anchor"
  );

  assert.match(
    globalCss,
    /\.queue-history-sort-hardening-plus-execution-panel/,
    "history sort hardening plus execution panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-history-sort-hardening-plus-execution-list/,
    "history sort hardening plus execution list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-response-execution-tracker-panel/,
    "delay risk response execution tracker panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-response-execution-tracker-list/,
    "delay risk response execution tracker list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-3-panel/,
    "mobile follow-up recommendation upgrade 3 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-3-list/,
    "mobile follow-up recommendation upgrade 3 list style should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-history-sort-hardening-plus-execution-list/,
    "responsive rule for history sort hardening plus execution list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-delay-risk-response-execution-tracker-list/,
    "responsive rule for delay risk response execution tracker list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-recommendation-upgrade-3-list/,
    "responsive rule for mobile recommendation upgrade 3 list should exist"
  );
}

run();
console.log(
  "e2e-wi0160-admin-approval-queue-ux-phase10-history-sort-hardening-plus-execution-delay-risk-response-execution-tracker-mobile-follow-up-recommendation-upgrade3.test passed"
);
