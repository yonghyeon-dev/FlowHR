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
    "WI-0544-admin-people-history-top-change-hotspot-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(historyPanel, /historyChangeSummary\[0\]/);
  assert.match(historyPanel, /Top changed field/);
  assert.match(historyPanel, /historyChangeSummary\[0\]\.label/);
  assert.match(historyPanel, /historyChangeSummary\[0\]\.count/);

  assert.ok(
    countLines(historyPanel) <= 220,
    `admin/people/page-view-history-panel.tsx should stay <= 220 lines (current: ${countLines(historyPanel)})`
  );

  assert.match(workItem, /WI-0544/i);
  assert.match(workItem, /admin|people|history|top change|hotspot|summary/i);
  assert.match(roadmap, /WI-0544/i);
}

run()
  .then(() => {
    console.log("e2e-wi0544-admin-people-history-top-change-hotspot-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

