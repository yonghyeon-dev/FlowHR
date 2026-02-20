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

  assert.match(adminPage, /queueSearchSortRows/, "admin page should compute queue search/sort rows");
  assert.match(
    adminPage,
    /filteredQueueSearchSortRows/,
    "admin page should compute filtered queue search/sort rows"
  );
  assert.match(
    adminPage,
    /queueProcessingPredictionCards/,
    "admin page should compute processing prediction cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpGuideCards/,
    "admin page should compute mobile follow-up guide cards"
  );
  assert.match(adminPage, /queueSearchSortScope/, "admin page should track search/sort scope");
  assert.match(adminPage, /queueSearchSortQuery/, "admin page should track search/sort query");
  assert.match(adminPage, /queueSearchSortOption/, "admin page should track search/sort option");
  assert.match(adminPage, /id="approval-search-sort"/, "admin page should expose queue search/sort section");
  assert.match(
    adminPage,
    /id="approval-processing-prediction"/,
    "admin page should expose processing prediction section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-guide"/,
    "admin page should expose mobile follow-up guide section"
  );
  assert.match(
    adminPage,
    /aria-label="approval queue search and sort list"/,
    "admin page should render queue search/sort list"
  );
  assert.match(
    adminPage,
    /aria-label="approval processing prediction feedback list"/,
    "admin page should render processing prediction list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up action guide list"/,
    "admin page should render mobile follow-up guide list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-search-sort/,
    "admin nav should include queue search/sort anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-processing-prediction/,
    "admin nav should include processing prediction anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-guide/,
    "admin nav should include mobile follow-up guide anchor"
  );

  assert.match(globalCss, /\.queue-search-sort-panel/, "queue search/sort panel style should exist");
  assert.match(globalCss, /\.queue-search-sort-list/, "queue search/sort list style should exist");
  assert.match(
    globalCss,
    /\.queue-processing-prediction-panel/,
    "processing prediction panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-processing-prediction-list/,
    "processing prediction list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-guide-panel/,
    "mobile follow-up guide panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-guide-list/,
    "mobile follow-up guide list style should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-search-sort-list/,
    "responsive rule for queue search/sort list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-processing-prediction-list/,
    "responsive rule for processing prediction list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-guide-list/,
    "responsive rule for mobile follow-up guide list should exist"
  );
}

run();
console.log(
  "e2e-wi0143-admin-approval-queue-ux-phase6-search-sort-processing-prediction-mobile-follow-up-guide.test passed"
);
