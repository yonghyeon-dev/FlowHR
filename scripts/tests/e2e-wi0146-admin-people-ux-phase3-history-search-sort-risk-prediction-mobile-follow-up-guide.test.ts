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

  assert.match(peoplePage, /historySearchSortRows/, "people page should compute history search/sort rows");
  assert.match(
    peoplePage,
    /filteredHistorySearchSortRows/,
    "people page should compute filtered history search/sort rows"
  );
  assert.match(
    peoplePage,
    /historyRiskPredictionCards/,
    "people page should compute history risk prediction cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpGuideCards/,
    "people page should compute mobile follow-up guide cards"
  );
  assert.match(peoplePage, /historySearchScope/, "people page should track history search scope");
  assert.match(peoplePage, /historySearchQuery/, "people page should track history search query");
  assert.match(peoplePage, /historySortOption/, "people page should track history sort option");
  assert.match(peoplePage, /historyRiskOnly/, "people page should track risk-only filter option");
  assert.match(peoplePage, /id="history-search-sort"/, "people page should expose history search/sort section");
  assert.match(
    peoplePage,
    /id="history-risk-prediction"/,
    "people page should expose history risk prediction section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-guide"/,
    "people page should expose mobile follow-up guide section"
  );
  assert.match(
    peoplePage,
    /aria-label="people history search and sort list"/,
    "people page should render history search/sort list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history risk prediction feedback list"/,
    "people page should render history risk prediction list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up action guide list"/,
    "people page should render people mobile follow-up guide list"
  );

  assert.match(adminLayout, /\/admin\/people/, "admin nav should include people directory route");

  assert.match(globalCss, /\.panel-history-search-sort/, "history search/sort panel style should exist");
  assert.match(globalCss, /\.history-search-list/, "history search/sort list style should exist");
  assert.match(globalCss, /\.panel-history-risk-prediction/, "history risk prediction panel style should exist");
  assert.match(globalCss, /\.history-risk-prediction-list/, "history risk prediction list style should exist");
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-guide/,
    "people mobile follow-up guide panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-guide-list/,
    "people mobile follow-up guide list style should exist"
  );
  assert.match(
    globalCss,
    /#history-search-sort \.history-search-list/,
    "responsive rule for history search/sort list should exist"
  );
  assert.match(
    globalCss,
    /#history-risk-prediction \.history-risk-prediction-list/,
    "responsive rule for history risk prediction list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-guide \.people-mobile-follow-up-guide-list/,
    "responsive rule for people mobile follow-up guide list should exist"
  );
}

run();
console.log(
  "e2e-wi0146-admin-people-ux-phase3-history-search-sort-risk-prediction-mobile-follow-up-guide.test passed"
);
