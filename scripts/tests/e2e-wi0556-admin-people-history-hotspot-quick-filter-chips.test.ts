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
  const historyPanel = readUtf8("src", "app", "admin", "people", "page-view-history-panel.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0556-admin-people-history-hotspot-quick-filter-chips.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(historyPanel, /history-change-summary-chip/);
  assert.match(historyPanel, /type="button"/);
  assert.match(historyPanel, /onClick=\{\(\) => setHistoryFieldFilter\(item\.field\)\}/);

  assert.ok(
    countLines(historyPanel) <= 220,
    `admin/people/page-view-history-panel.tsx should stay <= 220 lines (current: ${countLines(historyPanel)})`
  );

  assert.match(workItem, /WI-0556/i);
  assert.match(workItem, /admin|people|history|hotspot|quick filter|chips/i);
  assert.match(roadmap, /WI-0556/i);
}

run()
  .then(() => {
    console.log("e2e-wi0556-admin-people-history-hotspot-quick-filter-chips.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
