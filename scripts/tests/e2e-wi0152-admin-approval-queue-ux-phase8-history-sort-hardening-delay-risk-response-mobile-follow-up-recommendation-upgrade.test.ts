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
    /queueHistorySortHardeningCards/,
    "admin page should compute queue history sort hardening cards"
  );
  assert.match(
    adminPage,
    /queueDelayRiskResponseCards/,
    "admin page should compute queue delay risk response cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpRecommendationUpgradeCards/,
    "admin page should compute queue mobile follow-up recommendation upgrade cards"
  );
  assert.match(
    adminPage,
    /runQueueHistorySortHardeningAction/,
    "admin page should expose sort hardening action handler"
  );
  assert.match(
    adminPage,
    /runQueueDelayRiskResponseAction/,
    "admin page should expose delay risk response action handler"
  );
  assert.match(
    adminPage,
    /runQueueMobileFollowUpRecommendationUpgradeAction/,
    "admin page should expose recommendation upgrade action handler"
  );
  assert.match(
    adminPage,
    /id="approval-history-sort-hardening"/,
    "admin page should expose history sort hardening section"
  );
  assert.match(
    adminPage,
    /id="approval-delay-risk-response"/,
    "admin page should expose delay risk response section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-recommendation-upgrade"/,
    "admin page should expose mobile follow-up recommendation upgrade section"
  );
  assert.match(
    adminPage,
    /aria-label="approval history sort hardening feedback list"/,
    "admin page should render history sort hardening list"
  );
  assert.match(
    adminPage,
    /aria-label="approval delay risk response feedback list"/,
    "admin page should render delay risk response list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up recommendation upgrade list"/,
    "admin page should render mobile follow-up recommendation upgrade list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-history-sort-hardening/,
    "admin nav should include history sort hardening anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-delay-risk-response/,
    "admin nav should include delay risk response anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-recommendation-upgrade/,
    "admin nav should include mobile follow-up recommendation upgrade anchor"
  );

  assert.match(
    globalCss,
    /\.queue-history-sort-hardening-panel/,
    "history sort hardening panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-history-sort-hardening-list/,
    "history sort hardening list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-response-panel/,
    "delay risk response panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-response-list/,
    "delay risk response list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-panel/,
    "mobile follow-up recommendation upgrade panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-upgrade-list/,
    "mobile follow-up recommendation upgrade list style should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-history-sort-hardening-list/,
    "responsive rule for history sort hardening list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-delay-risk-response-list/,
    "responsive rule for delay risk response list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-recommendation-upgrade-list/,
    "responsive rule for mobile recommendation upgrade list should exist"
  );
}

run();
console.log(
  "e2e-wi0152-admin-approval-queue-ux-phase8-history-sort-hardening-delay-risk-response-mobile-follow-up-recommendation-upgrade.test passed"
);
