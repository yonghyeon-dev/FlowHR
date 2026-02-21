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

  assert.match(peoplePage, /departmentFilter/, "people page should track department filter state");
  assert.match(peoplePage, /positionFilter/, "people page should track position filter state");
  assert.match(peoplePage, /recentlyUpdatedDays/, "people page should track updated window filter");
  assert.match(peoplePage, /historyChangeSummary/, "people page should compute history change summary");
  assert.match(peoplePage, /changeHighlightClass/, "people page should compute change highlight class");
  assert.match(peoplePage, /jumpPeopleSection/, "people page should provide mobile section jump helper");
  assert.match(peoplePage, /id="directory-filters"/, "people page should expose filter anchor section");
  assert.match(peoplePage, /id="org-chart"/, "people page should expose org chart anchor section");
  assert.match(peoplePage, /id="employee-compare"/, "people page should expose compare anchor section");
  assert.match(peoplePage, /id="employee-history"/, "people page should expose history anchor section");
  assert.match(peoplePage, /id="people-mobile-flow"/, "people page should expose mobile flow anchor section");
  assert.match(peoplePage, /compare-change-chip/, "people page should render compare change chip");
  assert.match(peoplePage, /history-change-summary-list/, "people page should render history summary list");
  assert.match(peoplePage, /history-change-item/, "people page should render history highlight items");
  assert.match(peoplePage, /people-mobile-nav-grid/, "people page should render mobile navigation grid");
  assert.match(peoplePage, /people-mobile-feedback/, "people page should render mobile navigation feedback");

  assert.match(adminLayout, /\/admin\/people/, "admin nav should include people directory route");

  assert.match(globalCss, /\.panel-people-mobile-flow/, "people mobile flow panel style should exist");
  assert.match(globalCss, /\.people-mobile-nav-grid/, "people mobile navigation grid style should exist");
  assert.match(globalCss, /\.people-mobile-feedback/, "people mobile feedback style should exist");
  assert.match(globalCss, /\.compare-change-chip/, "compare change chip style should exist");
  assert.match(globalCss, /\.history-change-summary-list/, "history summary list style should exist");
  assert.match(globalCss, /\.history-change-summary-chip/, "history summary chip style should exist");
  assert.match(globalCss, /\.history-change-item\.highlight-org/, "history org highlight style should exist");
  assert.match(globalCss, /\.history-change-item\.highlight-job/, "history job highlight style should exist");
  assert.match(
    globalCss,
    /#people-mobile-flow \.people-mobile-nav-grid/,
    "people mobile nav responsive style should exist"
  );
}

run();
console.log("e2e-wi0135-admin-people-ux-phase2-filter-highlight-mobile-flow.test passed");
