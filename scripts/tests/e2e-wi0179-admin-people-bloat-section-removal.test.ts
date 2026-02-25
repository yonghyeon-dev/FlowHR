import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const peoplePageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const peopleSurface = `${peoplePage}\n${peoplePageView}`;
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const peoplePageLineCount = peoplePage.split(/\r?\n/).length;

  const removedSectionIds = [
    "history-search-sort",
    "history-sort-accuracy",
    "history-sort-hardening",
    "history-sort-hardening-plus",
    "history-sort-hardening-plus-execution",
    "history-sort-execution-summary",
    "history-execution-summary-digest",
    "history-risk-prediction",
    "history-delay-risk-prediction",
    "history-delay-risk-response",
    "history-delay-risk-response-execution-guide",
    "history-delay-risk-response-execution-tracker",
    "history-delay-risk-execution-backlog",
    "history-delay-execution-backlog-digest",
    "people-mobile-flow",
    "people-mobile-follow-up-guide",
    "people-mobile-follow-up-recommendation",
    "people-mobile-follow-up-recommendation-upgrade",
    "people-mobile-follow-up-recommendation-upgrade-2",
    "people-mobile-follow-up-recommendation-upgrade-3",
    "people-mobile-follow-up-recommendation-upgrade-4",
    "people-mobile-follow-up-recommendation-upgrade-5"
  ];

  for (const sectionId of removedSectionIds) {
    assert.equal(
      peopleSurface.includes(`id="${sectionId}"`),
      false,
      `people page should remove bloated section id="${sectionId}"`
    );
    assert.equal(
      adminLayout.includes(`/admin/people#${sectionId}`),
      false,
      `admin layout should remove bloated anchor /admin/people#${sectionId}`
    );
  }

  const requiredSectionIds = [
    "directory-filters",
    "org-chart",
    "employee-compare",
    "employee-history"
  ];

  for (const sectionId of requiredSectionIds) {
    assert.equal(
      peopleSurface.includes(`id="${sectionId}"`),
      true,
      `people page should keep core section id="${sectionId}"`
    );
  }

  assert.ok(
    peoplePageLineCount < 700,
    `people page should stay under 700 lines after decomposition cleanup (current: ${peoplePageLineCount})`
  );
}

run();
console.log("e2e-wi0179-admin-people-bloat-section-removal.test passed");
