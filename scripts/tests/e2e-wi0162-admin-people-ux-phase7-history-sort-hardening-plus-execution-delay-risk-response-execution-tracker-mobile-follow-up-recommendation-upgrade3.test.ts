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
    /historySortHardeningPlusExecutionCards/,
    "people page should compute history sort hardening plus execution cards"
  );
  assert.match(
    peoplePage,
    /historyDelayRiskResponseExecutionTrackerCards/,
    "people page should compute history delay risk response execution tracker cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpRecommendationUpgrade3Cards/,
    "people page should compute mobile follow-up recommendation upgrade 3 cards"
  );
  assert.match(
    peoplePage,
    /runHistorySortHardeningPlusExecutionAction/,
    "people page should expose history sort hardening plus execution action handler"
  );
  assert.match(
    peoplePage,
    /runHistoryDelayRiskResponseExecutionTrackerAction/,
    "people page should expose history delay risk response execution tracker action handler"
  );
  assert.match(
    peoplePage,
    /runPeopleMobileFollowUpRecommendationUpgrade3Action/,
    "people page should expose mobile recommendation upgrade 3 action handler"
  );
  assert.match(
    peoplePage,
    /id="history-sort-hardening-plus-execution"/,
    "people page should expose history sort hardening plus execution section"
  );
  assert.match(
    peoplePage,
    /id="history-delay-risk-response-execution-tracker"/,
    "people page should expose history delay risk response execution tracker section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-recommendation-upgrade-3"/,
    "people page should expose mobile follow-up recommendation upgrade 3 section"
  );
  assert.match(
    peoplePage,
    /aria-label="people history sort hardening plus execution list"/,
    "people page should render history sort hardening plus execution list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history delay risk response execution tracker list"/,
    "people page should render history delay risk response execution tracker list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up recommendation upgrade 3 list"/,
    "people page should render mobile recommendation upgrade 3 list"
  );

  assert.match(
    adminLayout,
    /\/admin\/people#history-sort-hardening-plus-execution/,
    "admin nav should include people history sort hardening plus execution anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#history-delay-risk-response-execution-tracker/,
    "admin nav should include people delay risk response execution tracker anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#people-mobile-follow-up-recommendation-upgrade-3/,
    "admin nav should include people mobile recommendation upgrade 3 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-history-sort-hardening-plus-execution/,
    "history sort hardening plus execution panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-sort-hardening-plus-execution-list/,
    "history sort hardening plus execution list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-history-delay-risk-response-execution-tracker/,
    "history delay risk response execution tracker panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-delay-risk-response-execution-tracker-list/,
    "history delay risk response execution tracker list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-recommendation-upgrade-3/,
    "people mobile recommendation upgrade 3 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-recommendation-upgrade-3-list/,
    "people mobile recommendation upgrade 3 list style should exist"
  );
  assert.match(
    globalCss,
    /#history-sort-hardening-plus-execution \.history-sort-hardening-plus-execution-list/,
    "responsive rule for history sort hardening plus execution list should exist"
  );
  assert.match(
    globalCss,
    /#history-delay-risk-response-execution-tracker \.history-delay-risk-response-execution-tracker-list/,
    "responsive rule for history delay risk response execution tracker list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-recommendation-upgrade-3 \.people-mobile-follow-up-recommendation-upgrade-3-list/,
    "responsive rule for people mobile recommendation upgrade 3 list should exist"
  );
}

run();
console.log(
  "e2e-wi0162-admin-people-ux-phase7-history-sort-hardening-plus-execution-delay-risk-response-execution-tracker-mobile-follow-up-recommendation-upgrade3.test passed"
);
