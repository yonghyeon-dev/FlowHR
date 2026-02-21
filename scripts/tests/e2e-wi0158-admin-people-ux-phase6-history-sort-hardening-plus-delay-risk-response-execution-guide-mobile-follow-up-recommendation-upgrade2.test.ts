import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    peoplePage,
    /historySortHardeningPlusCards/,
    "people page should compute history sort hardening plus cards"
  );
  assert.match(
    peoplePage,
    /historyDelayRiskResponseExecutionGuideCards/,
    "people page should compute history delay risk response execution guide cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpRecommendationUpgrade2Cards/,
    "people page should compute mobile follow-up recommendation upgrade 2 cards"
  );
  assert.match(
    peoplePage,
    /runHistorySortHardeningPlusAction/,
    "people page should expose history sort hardening plus action handler"
  );
  assert.match(
    peoplePage,
    /runHistoryDelayRiskResponseExecutionGuideAction/,
    "people page should expose history delay risk response execution guide action handler"
  );
  assert.match(
    peoplePage,
    /runPeopleMobileFollowUpRecommendationUpgrade2Action/,
    "people page should expose mobile recommendation upgrade 2 action handler"
  );
  assert.match(
    peoplePage,
    /id="history-sort-hardening-plus"/,
    "people page should expose history sort hardening plus section"
  );
  assert.match(
    peoplePage,
    /id="history-delay-risk-response-execution-guide"/,
    "people page should expose history delay risk response execution guide section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-recommendation-upgrade-2"/,
    "people page should expose mobile follow-up recommendation upgrade 2 section"
  );
  assert.match(
    peoplePage,
    /aria-label="people history sort hardening plus feedback list"/,
    "people page should render history sort hardening plus list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history delay risk response execution guide list"/,
    "people page should render history delay risk response execution guide list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up recommendation upgrade 2 list"/,
    "people page should render mobile recommendation upgrade 2 list"
  );

  assert.match(
    adminLayout,
    /\/admin\/people#history-sort-hardening-plus/,
    "admin nav should include people history sort hardening plus anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#history-delay-risk-response-execution-guide/,
    "admin nav should include people delay risk response execution guide anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#people-mobile-follow-up-recommendation-upgrade-2/,
    "admin nav should include people mobile recommendation upgrade 2 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-history-sort-hardening-plus/,
    "history sort hardening plus panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-sort-hardening-plus-list/,
    "history sort hardening plus list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-history-delay-risk-response-execution-guide/,
    "history delay risk response execution guide panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-delay-risk-response-execution-guide-list/,
    "history delay risk response execution guide list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-recommendation-upgrade-2/,
    "people mobile recommendation upgrade 2 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-recommendation-upgrade-2-list/,
    "people mobile recommendation upgrade 2 list style should exist"
  );
  assert.match(
    globalCss,
    /#history-sort-hardening-plus \.history-sort-hardening-plus-list/,
    "responsive rule for history sort hardening plus list should exist"
  );
  assert.match(
    globalCss,
    /#history-delay-risk-response-execution-guide \.history-delay-risk-response-execution-guide-list/,
    "responsive rule for history delay risk response execution guide list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-recommendation-upgrade-2 \.people-mobile-follow-up-recommendation-upgrade-2-list/,
    "responsive rule for people mobile recommendation upgrade 2 list should exist"
  );
}

run();
console.log(
  "e2e-wi0158-admin-people-ux-phase6-history-sort-hardening-plus-delay-risk-response-execution-guide-mobile-follow-up-recommendation-upgrade2.test passed"
);
