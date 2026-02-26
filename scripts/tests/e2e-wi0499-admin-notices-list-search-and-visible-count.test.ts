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
  const workspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const view = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0499-admin-notices-list-search-and-visible-count.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `AdminNoticeWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /listSearchQuery/);
  assert.match(workspace, /filteredNotices/);
  assert.match(workspace, /haystack\.includes\(query\)/);

  assert.match(view, /copy\.listSearchLabel/);
  assert.match(view, /copy\.listSearchPlaceholder/);
  assert.match(view, /copy\.clearListSearchAction/);
  assert.match(view, /copy\.filteredListSummaryLabel/);
  assert.match(view, /copy\.filteredListEmpty/);
  assert.match(view, /filteredNotices\.map/);

  assert.match(copy, /listSearchLabel/);
  assert.match(copy, /listSearchPlaceholder/);
  assert.match(copy, /clearListSearchAction/);
  assert.match(copy, /filteredListSummaryLabel/);
  assert.match(copy, /filteredListEmpty/);

  assert.match(workItem, /WI-0499/i);
  assert.match(workItem, /notices|search|visible|admin/i);
  assert.match(roadmap, /WI-0499/i);
}

run()
  .then(() => {
    console.log("e2e-wi0499-admin-notices-list-search-and-visible-count.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
