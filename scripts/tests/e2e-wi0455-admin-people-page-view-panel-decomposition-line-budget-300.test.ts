import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const pageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const filtersPanel = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-view-directory-filters-panel.tsx"
  );
  const orgChartPanel = readUtf8("src", "app", "admin", "people", "page-view-org-chart-panel.tsx");
  const comparePanel = readUtf8("src", "app", "admin", "people", "page-view-compare-panel.tsx");
  const historyPanel = readUtf8("src", "app", "admin", "people", "page-view-history-panel.tsx");
  const logsPanel = readUtf8("src", "app", "admin", "people", "page-view-logs-panel.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0455-admin-people-page-view-panel-decomposition-line-budget-300.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(pageView, /AdminPeopleDirectoryFiltersPanel/);
  assert.match(pageView, /AdminPeopleOrgChartPanel/);
  assert.match(pageView, /AdminPeopleComparePanel/);
  assert.match(pageView, /AdminPeopleHistoryPanel/);
  assert.match(pageView, /AdminPeopleLogsPanel/);
  assert.match(pageView, /id="directory-filters"/);
  assert.match(pageView, /id="org-chart"/);
  assert.match(pageView, /id="employee-compare"/);
  assert.match(pageView, /id="employee-history"/);
  assert.match(pageView, /요청 로그/);
  assert.ok(
    countLines(pageView) <= 300,
    `admin people page-view should stay <= 300 lines (current: ${countLines(pageView)})`
  );

  assert.ok(
    countLines(filtersPanel) <= 220,
    `directory filters panel should stay <= 220 lines (current: ${countLines(filtersPanel)})`
  );
  assert.ok(
    countLines(orgChartPanel) <= 160,
    `org chart panel should stay <= 160 lines (current: ${countLines(orgChartPanel)})`
  );
  assert.ok(
    countLines(comparePanel) <= 160,
    `compare panel should stay <= 160 lines (current: ${countLines(comparePanel)})`
  );
  assert.ok(
    countLines(historyPanel) <= 220,
    `history panel should stay <= 220 lines (current: ${countLines(historyPanel)})`
  );
  assert.ok(
    countLines(logsPanel) <= 120,
    `logs panel should stay <= 120 lines (current: ${countLines(logsPanel)})`
  );

  assert.match(workItem, /WI-0455/i);
  assert.match(workItem, /people|page-view|panel|decomposition|line budget/i);
  assert.match(roadmap, /WI-0455/i);
}

run()
  .then(() => {
    console.log("e2e-wi0455-admin-people-page-view-panel-decomposition-line-budget-300.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
