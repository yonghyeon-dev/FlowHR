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
    /historySortExecutionSummaryCards/,
    "people page should compute history sort execution summary cards"
  );
  assert.match(
    peoplePage,
    /historyDelayRiskExecutionBacklogCards/,
    "people page should compute history delay risk execution backlog cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpRecommendationUpgrade4Cards/,
    "people page should compute mobile follow-up recommendation upgrade 4 cards"
  );
  assert.match(
    peoplePage,
    /runHistorySortExecutionSummaryAction/,
    "people page should expose history sort execution summary action handler"
  );
  assert.match(
    peoplePage,
    /runHistoryDelayRiskExecutionBacklogAction/,
    "people page should expose history delay risk execution backlog action handler"
  );
  assert.match(
    peoplePage,
    /runPeopleMobileFollowUpRecommendationUpgrade4Action/,
    "people page should expose mobile recommendation upgrade 4 action handler"
  );

  assert.match(
    peoplePage,
    /id="history-sort-execution-summary"/,
    "people page should expose history sort execution summary section"
  );
  assert.match(
    peoplePage,
    /id="history-delay-risk-execution-backlog"/,
    "people page should expose history delay risk execution backlog section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-recommendation-upgrade-4"/,
    "people page should expose mobile follow-up recommendation upgrade 4 section"
  );

  assert.match(
    peoplePage,
    /aria-label="people history sort execution summary list"/,
    "people page should render history sort execution summary list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history delay risk execution backlog list"/,
    "people page should render history delay risk execution backlog list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up recommendation upgrade 4 list"/,
    "people page should render mobile recommendation upgrade 4 list"
  );

  assert.match(
    adminLayout,
    /\/admin\/people#history-sort-execution-summary/,
    "admin nav should include people history sort execution summary anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#history-delay-risk-execution-backlog/,
    "admin nav should include people delay risk execution backlog anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#people-mobile-follow-up-recommendation-upgrade-4/,
    "admin nav should include people mobile recommendation upgrade 4 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-history-sort-execution-summary/,
    "history sort execution summary panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-sort-execution-summary-list/,
    "history sort execution summary list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-history-delay-risk-execution-backlog/,
    "history delay risk execution backlog panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-delay-risk-execution-backlog-list/,
    "history delay risk execution backlog list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-recommendation-upgrade-4/,
    "people mobile recommendation upgrade 4 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-recommendation-upgrade-4-list/,
    "people mobile recommendation upgrade 4 list style should exist"
  );
  assert.match(
    globalCss,
    /#history-sort-execution-summary \.history-sort-execution-summary-list/,
    "responsive rule for history sort execution summary list should exist"
  );
  assert.match(
    globalCss,
    /#history-delay-risk-execution-backlog \.history-delay-risk-execution-backlog-list/,
    "responsive rule for history delay risk execution backlog list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-recommendation-upgrade-4 \.people-mobile-follow-up-recommendation-upgrade-4-list/,
    "responsive rule for people mobile recommendation upgrade 4 list should exist"
  );
}

run();
console.log(
  "e2e-wi0166-admin-people-ux-phase8-execution-summary-delay-backlog-mobile-follow-up-recommendation-upgrade4.test passed"
);
