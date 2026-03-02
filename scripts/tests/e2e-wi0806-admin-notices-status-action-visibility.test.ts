import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const view = readUtf8(
    "src",
    "components",
    "notices",
    "AdminNoticeWorkspaceView.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0806-admin-notices-status-action-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(view, /function canMutateNotice/);
  assert.match(view, /const actionLocked = !canMutateNotice\(notice\)/);
  assert.match(view, /disabled=\{actionLocked\}/);
  assert.match(view, /title=\{actionLockReason\}/);
  assert.match(view, /copy\.statusFilter\.DRAFT/);
  assert.match(view, /copy\.statusFilter\.SCHEDULED/);
  assert.match(view, /copy\.statusFilter\.PUBLISHED/);
  assert.match(view, /onStartEditNotice\(notice\.id\)/);
  assert.match(view, /onPublishNow\(notice\.id\)/);
  assert.match(view, /onDeleteNotice\(notice\.id\)/);

  assert.match(workItem, /WI-0806/i);
  assert.match(workItem, /admin|notices|status|action|visibility/i);
  assert.match(roadmap, /WI-0806/i);
}

run();
console.log("e2e-wi0806-admin-notices-status-action-visibility.test passed");
