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
    /historySortHardeningCards/,
    "people page should compute history sort hardening cards"
  );
  assert.match(
    peoplePage,
    /historyDelayRiskResponseCards/,
    "people page should compute history delay risk response cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpRecommendationUpgradeCards/,
    "people page should compute mobile follow-up recommendation upgrade cards"
  );
  assert.match(
    peoplePage,
    /runHistorySortHardeningAction/,
    "people page should expose history sort hardening action handler"
  );
  assert.match(
    peoplePage,
    /runHistoryDelayRiskResponseAction/,
    "people page should expose history delay risk response action handler"
  );
  assert.match(
    peoplePage,
    /runPeopleMobileFollowUpRecommendationUpgradeAction/,
    "people page should expose mobile recommendation upgrade action handler"
  );
  assert.match(
    peoplePage,
    /id="history-sort-hardening"/,
    "people page should expose history sort hardening section"
  );
  assert.match(
    peoplePage,
    /id="history-delay-risk-response"/,
    "people page should expose history delay risk response section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-recommendation-upgrade"/,
    "people page should expose mobile follow-up recommendation upgrade section"
  );
  assert.match(
    peoplePage,
    /aria-label="people history sort hardening feedback list"/,
    "people page should render history sort hardening list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history delay risk response feedback list"/,
    "people page should render history delay risk response list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up recommendation upgrade list"/,
    "people page should render mobile follow-up recommendation upgrade list"
  );

  assert.match(adminLayout, /\/admin\/people/, "admin nav should include people directory route");

  assert.match(
    globalCss,
    /\.panel-history-sort-hardening/,
    "history sort hardening panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-sort-hardening-list/,
    "history sort hardening list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-history-delay-risk-response/,
    "history delay risk response panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-delay-risk-response-list/,
    "history delay risk response list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-recommendation-upgrade/,
    "people mobile recommendation upgrade panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-recommendation-upgrade-list/,
    "people mobile recommendation upgrade list style should exist"
  );
  assert.match(
    globalCss,
    /#history-sort-hardening \.history-sort-hardening-list/,
    "responsive rule for history sort hardening list should exist"
  );
  assert.match(
    globalCss,
    /#history-delay-risk-response \.history-delay-risk-response-list/,
    "responsive rule for history delay risk response list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-recommendation-upgrade \.people-mobile-follow-up-recommendation-upgrade-list/,
    "responsive rule for people mobile recommendation upgrade list should exist"
  );
}

run();
console.log(
  "e2e-wi0154-admin-people-ux-phase5-history-sort-hardening-delay-risk-response-mobile-follow-up-recommendation-upgrade.test passed"
);
