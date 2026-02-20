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
    /queueHistorySortHardeningPlusCards/,
    "admin page should compute queue history sort hardening plus cards"
  );
  assert.match(
    adminPage,
    /queueDelayRiskResponseExecutionGuideCards/,
    "admin page should compute queue delay risk response execution guide cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpRecommendationUpgrade2Cards/,
    "admin page should compute queue mobile follow-up recommendation upgrade 2 cards"
  );
  assert.match(
    adminPage,
    /runQueueHistorySortHardeningPlusAction/,
    "admin page should expose sort hardening plus action handler"
  );
  assert.match(
    adminPage,
    /runQueueDelayRiskResponseExecutionGuideAction/,
    "admin page should expose delay risk response execution guide action handler"
  );
  assert.match(
    adminPage,
    /runQueueMobileFollowUpRecommendationUpgrade2Action/,
    "admin page should expose recommendation upgrade 2 action handler"
  );
  assert.match(
    adminPage,
    /id="approval-history-sort-hardening-plus"/,
    "admin page should expose history sort hardening plus section"
  );
  assert.match(
    adminPage,
    /id="approval-delay-risk-response-execution-guide"/,
    "admin page should expose delay risk response execution guide section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-recommendation-upgrade-2"/,
    "admin page should expose mobile follow-up recommendation upgrade 2 section"
  );
  assert.match(
    adminPage,
    /aria-label="approval history sort hardening plus feedback list"/,
    "admin page should render history sort hardening plus list"
  );
  assert.match(
    adminPage,
    /aria-label="approval delay risk response execution guide list"/,
    "admin page should render delay risk response execution guide list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up recommendation upgrade 2 list"/,
    "admin page should render mobile recommendation upgrade 2 list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-history-sort-hardening-plus/,
    "admin nav should include history sort hardening plus anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-delay-risk-response-execution-guide/,
    "admin nav should include delay risk response execution guide anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-recommendation-upgrade-2/,
    "admin nav should include mobile recommendation upgrade 2 anchor"
  );

  assert.match(
    globalCss,
    /\.queue-history-sort-hardening-plus-panel/,
    "history sort hardening plus panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-history-sort-hardening-plus-list/,
    "history sort hardening plus list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-response-execution-guide-panel/,
    "delay risk response execution guide panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-response-execution-guide-list/,
    "delay risk response execution guide list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-2-panel/,
    "mobile follow-up recommendation upgrade 2 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-2-list/,
    "mobile follow-up recommendation upgrade 2 list style should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-history-sort-hardening-plus-list/,
    "responsive rule for history sort hardening plus list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-delay-risk-response-execution-guide-list/,
    "responsive rule for delay risk response execution guide list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-recommendation-upgrade-2-list/,
    "responsive rule for mobile recommendation upgrade 2 list should exist"
  );
}

run();
console.log(
  "e2e-wi0156-admin-approval-queue-ux-phase9-history-sort-hardening-plus-delay-risk-response-execution-guide-mobile-follow-up-recommendation-upgrade2.test passed"
);
