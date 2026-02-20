import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(employeePage, /requestSearchRows/, "employee page should compute request search rows");
  assert.match(employeePage, /filteredRequestSearchRows/, "employee page should compute filtered request rows");
  assert.match(
    employeePage,
    /approvalWaitPredictionCards/,
    "employee page should compute approval wait prediction cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpGuideCards/,
    "employee page should compute mobile follow-up guide cards"
  );
  assert.match(employeePage, /requestSearchScope/, "employee page should track request search scope");
  assert.match(employeePage, /requestSearchQuery/, "employee page should track request search query");
  assert.match(employeePage, /requestSortOption/, "employee page should track request sort option");
  assert.match(employeePage, /id="request-search-sort"/, "employee page should expose request search/sort section");
  assert.match(
    employeePage,
    /id="request-wait-prediction"/,
    "employee page should expose wait prediction section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-guide"/,
    "employee page should expose mobile follow-up guide section"
  );
  assert.match(
    employeePage,
    /aria-label="request search and sort list"/,
    "employee page should render request search/sort list"
  );
  assert.match(
    employeePage,
    /aria-label="request wait prediction feedback list"/,
    "employee page should render wait prediction list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up action guide list"/,
    "employee page should render mobile follow-up guide list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-search-sort/,
    "employee nav should include request search/sort anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#request-wait-prediction/,
    "employee nav should include request wait prediction anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-guide/,
    "employee nav should include mobile follow-up guide anchor"
  );

  assert.match(globalCss, /\.panel-request-search-sort/, "request search/sort panel style should exist");
  assert.match(globalCss, /\.request-search-list/, "request search list style should exist");
  assert.match(globalCss, /\.panel-request-wait-prediction/, "wait prediction panel style should exist");
  assert.match(globalCss, /\.request-wait-prediction-list/, "wait prediction list style should exist");
  assert.match(globalCss, /\.panel-mobile-follow-up-guide/, "mobile follow-up panel style should exist");
  assert.match(globalCss, /\.mobile-follow-up-guide-list/, "mobile follow-up list style should exist");
  assert.match(
    globalCss,
    /#request-search-sort \.request-search-list/,
    "responsive rule for request search list should exist"
  );
  assert.match(
    globalCss,
    /#request-wait-prediction \.request-wait-prediction-list/,
    "responsive rule for wait prediction list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-guide \.mobile-follow-up-guide-list/,
    "responsive rule for mobile follow-up list should exist"
  );
}

run();
console.log(
  "e2e-wi0142-employee-self-service-phase7-request-search-sort-wait-prediction-mobile-follow-up-guide.test passed"
);
