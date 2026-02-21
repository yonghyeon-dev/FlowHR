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
    /historySortAccuracyCards/,
    "people page should compute history sort accuracy cards"
  );
  assert.match(
    peoplePage,
    /historyDelayRiskPredictionCards/,
    "people page should compute history delay risk prediction cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpRecommendationCards/,
    "people page should compute mobile follow-up recommendation cards"
  );
  assert.match(
    peoplePage,
    /runPeopleMobileFollowUpRecommendationAction/,
    "people page should expose recommendation action handler"
  );
  assert.match(
    peoplePage,
    /id="history-sort-accuracy"/,
    "people page should expose history sort accuracy section"
  );
  assert.match(
    peoplePage,
    /id="history-delay-risk-prediction"/,
    "people page should expose history delay risk prediction section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-recommendation"/,
    "people page should expose mobile follow-up recommendation section"
  );
  assert.match(
    peoplePage,
    /aria-label="people history sort accuracy feedback list"/,
    "people page should render history sort accuracy list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history delay risk prediction feedback list"/,
    "people page should render history delay risk prediction list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up recommendation list"/,
    "people page should render mobile follow-up recommendation list"
  );

  assert.match(adminLayout, /\/admin\/people/, "admin nav should include people directory route");

  assert.match(
    globalCss,
    /\.panel-history-sort-accuracy/,
    "history sort accuracy panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-sort-accuracy-list/,
    "history sort accuracy list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-history-delay-risk-prediction/,
    "history delay risk prediction panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-delay-risk-prediction-list/,
    "history delay risk prediction list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-recommendation/,
    "people mobile follow-up recommendation panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-recommendation-list/,
    "people mobile follow-up recommendation list style should exist"
  );
  assert.match(
    globalCss,
    /#history-sort-accuracy \.history-sort-accuracy-list/,
    "responsive rule for history sort accuracy list should exist"
  );
  assert.match(
    globalCss,
    /#history-delay-risk-prediction \.history-delay-risk-prediction-list/,
    "responsive rule for history delay risk prediction list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-recommendation \.people-mobile-follow-up-recommendation-list/,
    "responsive rule for people mobile follow-up recommendation list should exist"
  );
}

run();
console.log(
  "e2e-wi0150-admin-people-ux-phase4-history-sort-accuracy-delay-risk-mobile-follow-up-recommendation.test passed"
);
