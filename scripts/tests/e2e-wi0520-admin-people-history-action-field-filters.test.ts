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
  const pageTypes = readUtf8("src", "app", "admin", "people", "page-types.ts");
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const pageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const historyPanel = readUtf8("src", "app", "admin", "people", "page-view-history-panel.tsx");
  const workItem = readUtf8("work-items", "WI-0520-admin-people-history-action-field-filters.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(pageTypes, /export type HistoryActionFilter = "all" \| "employee\.created" \| "employee\.profile\.updated"/);
  assert.match(pageTypes, /export type HistoryFieldFilter = "all" \| ProfileField/);

  assert.match(peoplePage, /const \[historyActionFilter, setHistoryActionFilter\]/);
  assert.match(peoplePage, /const \[historyFieldFilter, setHistoryFieldFilter\]/);
  assert.match(peoplePage, /const filteredHistory = useMemo/);
  assert.match(peoplePage, /historyChanges\(entry\)\.some\(\(change\) => change\.field === historyFieldFilter\)/);
  assert.match(peoplePage, /for \(const entry of filteredHistory\)/);

  assert.match(pageView, /filteredHistory=\{filteredHistory\}/);
  assert.match(pageView, /historyActionFilter=\{historyActionFilter\}/);
  assert.match(pageView, /historyFieldFilter=\{historyFieldFilter\}/);

  assert.match(historyPanel, /Action filter/);
  assert.match(historyPanel, /Changed field filter/);
  assert.match(historyPanel, /Visible history/);
  assert.match(historyPanel, /employee\.created/);
  assert.match(historyPanel, /employee\.profile\.updated/);

  assert.ok(
    countLines(peoplePage) <= 420,
    `admin/people/page.tsx should stay <= 420 lines (current: ${countLines(peoplePage)})`
  );
  assert.ok(
    countLines(pageView) <= 300,
    `admin/people/page-view.tsx should stay <= 300 lines (current: ${countLines(pageView)})`
  );
  assert.ok(
    countLines(historyPanel) <= 220,
    `admin/people/page-view-history-panel.tsx should stay <= 220 lines (current: ${countLines(historyPanel)})`
  );

  assert.match(workItem, /WI-0520/i);
  assert.match(workItem, /history|action|field|filter|people|admin/i);
  assert.match(roadmap, /WI-0520/i);
}

run()
  .then(() => {
    console.log("e2e-wi0520-admin-people-history-action-field-filters.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
