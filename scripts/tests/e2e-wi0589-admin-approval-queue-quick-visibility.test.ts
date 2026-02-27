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
  const searchSortPanel = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueSearchSortPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0589-admin-approval-queue-quick-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(searchSortPanel, /summaryVisible:/);
  assert.match(searchSortPanel, /summaryCritical:/);
  assert.match(searchSortPanel, /summaryWatch:/);
  assert.match(searchSortPanel, /summarySelected:/);
  assert.match(searchSortPanel, /focusCriticalQueue:/);
  assert.match(searchSortPanel, /const summary = useMemo\(\(\) => \{/);
  assert.match(searchSortPanel, /const focusCriticalQueue = useMemo\(\(\) => \{/);
  assert.match(searchSortPanel, /row\.severity === "critical"/);
  assert.match(searchSortPanel, /copy\.focusCriticalQueue/);
  assert.match(searchSortPanel, /onFocusQueue\(focusCriticalQueue\)/);
  assert.match(searchSortPanel, /copy\.summaryVisible/);
  assert.match(searchSortPanel, /copy\.summaryCritical/);
  assert.match(searchSortPanel, /copy\.summaryWatch/);
  assert.match(searchSortPanel, /copy\.summarySelected/);

  assert.ok(
    countLines(searchSortPanel) <= 300,
    `ApprovalQueueSearchSortPanel.tsx should stay <= 300 lines (current: ${countLines(searchSortPanel)})`
  );

  assert.match(workItem, /WI-0589/i);
  assert.match(workItem, /approval|queue|quick|visibility|summary|critical/i);
  assert.match(roadmap, /WI-0589/i);
}

run()
  .then(() => {
    console.log("e2e-wi0589-admin-approval-queue-quick-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
