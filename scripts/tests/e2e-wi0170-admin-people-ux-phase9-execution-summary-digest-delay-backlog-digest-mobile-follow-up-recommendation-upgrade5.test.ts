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
    /historyExecutionSummaryDigestCards/,
    "people page should compute history execution summary digest cards"
  );
  assert.match(
    peoplePage,
    /historyDelayExecutionBacklogDigestCards/,
    "people page should compute history delay execution backlog digest cards"
  );
  assert.match(
    peoplePage,
    /peopleMobileFollowUpRecommendationUpgrade5Cards/,
    "people page should compute mobile follow-up recommendation upgrade 5 cards"
  );
  assert.match(
    peoplePage,
    /runHistoryExecutionSummaryDigestAction/,
    "people page should expose history execution summary digest action handler"
  );
  assert.match(
    peoplePage,
    /runHistoryDelayExecutionBacklogDigestAction/,
    "people page should expose history delay execution backlog digest action handler"
  );
  assert.match(
    peoplePage,
    /runPeopleMobileFollowUpRecommendationUpgrade5Action/,
    "people page should expose mobile recommendation upgrade 5 action handler"
  );

  assert.match(
    peoplePage,
    /id="history-execution-summary-digest"/,
    "people page should expose history execution summary digest section"
  );
  assert.match(
    peoplePage,
    /id="history-delay-execution-backlog-digest"/,
    "people page should expose history delay execution backlog digest section"
  );
  assert.match(
    peoplePage,
    /id="people-mobile-follow-up-recommendation-upgrade-5"/,
    "people page should expose mobile follow-up recommendation upgrade 5 section"
  );

  assert.match(
    peoplePage,
    /aria-label="people history execution summary digest list"/,
    "people page should render history execution summary digest list"
  );
  assert.match(
    peoplePage,
    /aria-label="people history delay execution backlog digest list"/,
    "people page should render history delay execution backlog digest list"
  );
  assert.match(
    peoplePage,
    /aria-label="people mobile follow-up recommendation upgrade 5 list"/,
    "people page should render mobile recommendation upgrade 5 list"
  );

  assert.match(
    adminLayout,
    /\/admin\/people#history-execution-summary-digest/,
    "admin nav should include people history execution summary digest anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#history-delay-execution-backlog-digest/,
    "admin nav should include people delay execution backlog digest anchor"
  );
  assert.match(
    adminLayout,
    /\/admin\/people#people-mobile-follow-up-recommendation-upgrade-5/,
    "admin nav should include people mobile recommendation upgrade 5 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-history-execution-summary-digest/,
    "history execution summary digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-execution-summary-digest-list/,
    "history execution summary digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-history-delay-execution-backlog-digest/,
    "history delay execution backlog digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.history-delay-execution-backlog-digest-list/,
    "history delay execution backlog digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-people-mobile-follow-up-recommendation-upgrade-5/,
    "people mobile recommendation upgrade 5 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.people-mobile-follow-up-recommendation-upgrade-5-list/,
    "people mobile recommendation upgrade 5 list style should exist"
  );
  assert.match(
    globalCss,
    /#history-execution-summary-digest \.history-execution-summary-digest-list/,
    "responsive rule for history execution summary digest list should exist"
  );
  assert.match(
    globalCss,
    /#history-delay-execution-backlog-digest \.history-delay-execution-backlog-digest-list/,
    "responsive rule for history delay execution backlog digest list should exist"
  );
  assert.match(
    globalCss,
    /#people-mobile-follow-up-recommendation-upgrade-5 \.people-mobile-follow-up-recommendation-upgrade-5-list/,
    "responsive rule for people mobile recommendation upgrade 5 list should exist"
  );
}

run();
console.log(
  "e2e-wi0170-admin-people-ux-phase9-execution-summary-digest-delay-backlog-digest-mobile-follow-up-recommendation-upgrade5.test passed"
);
