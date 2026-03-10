import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(path.join(process.cwd(), ...parts), "utf8");
}

const workspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
const view = readUtf8("src", "components", "notices", "AdminNoticeWorkspaceView.tsx");
const copy = readUtf8("src", "components", "notices", "copy.ts");
const workItem = readUtf8("work-items", "WI-1099-ui-ux-wave1-confirmation-feedback-and-empty-state-recovery.md");
const progress = readUtf8("docs", "production-operating-progress.md");

assert.match(workspace, /window\.confirm\(copy\.messages\.publishConfirm\(target\.title\)\)/);
assert.match(workspace, /window\.confirm\(copy\.messages\.deleteConfirm\(target\.title\)\)/);
assert.match(workspace, /const \[statusTone, setStatusTone\] = useState<NoticeStatusTone \| null>\(null\);/);
assert.match(workspace, /updateStatus\("success", copy\.messages\.published\)/);
assert.match(workspace, /updateStatus\("error", copy\.messages\.deleteFailed \?\? copy\.messages\.loadFailed\)/);

assert.match(view, /statusTone: "info" \| "success" \| "error" \| null;/);
assert.match(view, /const statusMessageClassName =/);
assert.match(view, /copy\.listEmptyHelp/);
assert.match(view, /copy\.filteredListEmptyHelp/);
assert.match(view, /disabled=\{Boolean\(pendingLabel\)\}/);

assert.match(copy, /listEmptyHelp: string;/);
assert.match(copy, /filteredListEmptyHelp: string;/);
assert.match(copy, /publishConfirm: \(title: string\) => string;/);
assert.match(copy, /deleteConfirm: \(title: string\) => string;/);
assert.match(copy, /refreshed: "공지 목록을 새로고침했습니다\."|refreshed: "Notice list refreshed\."/);

assert.match(workItem, /admin notices workspace/i);
assert.match(progress, /Started `WI-1099`/);

console.log("e2e-wi1099-ui-ux-wave1-confirmation-feedback-and-empty-state-recovery.test passed");
