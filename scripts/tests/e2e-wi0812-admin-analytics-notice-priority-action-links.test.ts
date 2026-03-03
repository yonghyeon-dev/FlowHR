import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminNoticesKpiPanel.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const noticeWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0812-admin-analytics-notice-priority-action-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /function resolveNoticePriorityAction\(/);
  assert.match(panel, /\/admin\/notices\?status=PUBLISHED&risk=no-read/);
  assert.match(panel, /copy\.noticesPanel\.priorityActionLabel/);
  assert.match(panel, /copy\.noticesPanel\.quickActionsLabel/);
  assert.match(panel, /copy\.noticesPanel\.actionOpenNoticeWorkspace/);
  assert.match(panel, /copy\.noticesPanel\.actionOpenNoReadQueue/);

  assert.match(copy, /priorityActionLabel/);
  assert.match(copy, /quickActionsLabel/);
  assert.match(copy, /actionOpenNoticeWorkspace/);
  assert.match(copy, /actionOpenNoReadQueue/);
  assert.match(copy, /priorityReasonAging/);
  assert.match(copy, /priorityReasonNoRead/);
  assert.match(copy, /priorityReasonClear/);

  assert.match(noticeWorkspace, /import \{ useSearchParams \} from "next\/navigation";/);
  assert.match(noticeWorkspace, /normalizeNoticeStatusFilter\(searchParams\.get\("status"\)\)/);
  assert.match(noticeWorkspace, /normalizeNoticeAudienceFilter\(searchParams\.get\("audience"\)\)/);
  assert.match(noticeWorkspace, /parseNoticeSearchKeyword\(searchParams\.get\("q"\)\)/);
  assert.match(noticeWorkspace, /parseNoticeReadRiskFilter\(searchParams\.get\("risk"\)\)/);

  assert.match(workItem, /WI-0812/i);
  assert.match(workItem, /admin|analytics|notice|priority|action|link/i);
  assert.match(roadmap, /WI-0812/i);
}

run();
console.log("e2e-wi0812-admin-analytics-notice-priority-action-links.test passed");
