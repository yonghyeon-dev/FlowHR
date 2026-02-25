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
  const workItem = readUtf8(
    "work-items",
    "WI-0473-admin-notice-workspace-view-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(workspace) <= 300, "AdminNoticeWorkspace must stay <= 300 lines");
  assert.match(workspace, /import AdminNoticeWorkspaceView/);
  assert.match(workspace, /<AdminNoticeWorkspaceView/);
  assert.match(view, /copy\.pageTitle/);
  assert.match(view, /copy\.composeTitle/);
  assert.match(view, /copy\.listTitle/);
  assert.match(view, /copy\.logsTitle/);

  assert.match(workItem, /WI-0473/i);
  assert.match(workItem, /notice|workspace|view|decomposition/i);
  assert.match(roadmap, /WI-0473/i);
}

run()
  .then(() => {
    console.log("e2e-wi0473-admin-notice-workspace-view-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
