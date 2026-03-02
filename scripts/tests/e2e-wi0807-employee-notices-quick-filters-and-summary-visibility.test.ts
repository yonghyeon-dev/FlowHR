import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const board = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0807-employee-notices-quick-filters-and-summary-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(board, /const isAllQuickFilter = !unreadOnly && readStatusFilter === "all" && agingRiskFilter === "all";/);
  assert.match(
    board,
    /const isUnreadQuickFilter = !unreadOnly && readStatusFilter === "unread" && agingRiskFilter === "all";/
  );
  assert.match(board, /const isAgingRiskQuickFilter =/);
  assert.match(board, /function applyQuickFilter\(/);
  assert.match(board, /onClick=\{\(\) => applyQuickFilter\("all", "all"\)\}/);
  assert.match(board, /onClick=\{\(\) => applyQuickFilter\("unread", "all"\)\}/);
  assert.match(board, /onClick=\{\(\) => applyQuickFilter\("unread", "aging_3d"\)\}/);
  assert.match(board, /copy\.readStatusFilterAllOption\} \(\{notices\.length\}\)/);
  assert.match(board, /copy\.readStatusFilterUnreadOption\} \(\{unreadCount\}\)/);
  assert.match(board, /copy\.agingRiskFilterOnlyOption\} \(\{unreadAgingRiskCount\}\)/);
  assert.match(board, /copy\.readStatusFilterReadOption\}: \{readCount\}/);
  assert.match(board, /\/ \{copy\.filteredSummaryLabel\}/);
  assert.doesNotMatch(board, /쨌/);

  assert.match(workItem, /WI-0807/i);
  assert.match(workItem, /employee|notices|quick|filter|summary|visibility/i);
  assert.match(roadmap, /WI-0807/i);
}

run();
console.log("e2e-wi0807-employee-notices-quick-filters-and-summary-visibility.test passed");
