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
  const board = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const boardList = readUtf8("src", "components", "notices", "EmployeeNoticeBoardList.tsx");
  const helpers = readUtf8("src", "components", "notices", "employee-notice-board-helpers.ts");
  const copy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0527-employee-notice-read-status-filter-and-line-budget-hardening.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(board) <= 320,
    `EmployeeNoticeBoard.tsx must stay <= 320 lines (current: ${countLines(board)})`
  );
  assert.match(board, /EmployeeNoticeBoardList/);
  assert.match(board, /buildNoticeQuery/);
  assert.match(board, /filterEmployeeNotices/);
  assert.match(board, /normalizeEmployeeNoticeReadStatusFilter/);
  assert.match(board, /const \[readStatusFilter, setReadStatusFilter\] = useState/);
  assert.match(board, /copy\.readStatusFilterLabel/);
  assert.match(board, /copy\.readStatusFilterAllOption/);
  assert.match(board, /copy\.readStatusFilterUnreadOption/);
  assert.match(board, /copy\.readStatusFilterReadOption/);

  assert.match(boardList, /resolveNoticeAudienceLabel/);
  assert.match(boardList, /copy\.markReadAction/);
  assert.match(boardList, /copy\.filteredListEmpty/);
  assert.match(boardList, /filteredNotices\.map\(\(notice\) => \{/);

  assert.match(helpers, /export type EmployeeNoticeReadStatusFilter = "all" \| "unread" \| "read"/);
  assert.match(helpers, /export function normalizeEmployeeNoticeReadStatusFilter/);
  assert.match(helpers, /readStatusFilter === "read"/);
  assert.match(helpers, /readStatusFilter === "unread"/);
  assert.match(helpers, /export function filterEmployeeNotices/);
  assert.match(helpers, /export function buildReadAtByNoticeIdMap/);

  assert.match(copy, /readStatusFilterLabel: string;/);
  assert.match(copy, /readStatusFilterAllOption: string;/);
  assert.match(copy, /readStatusFilterUnreadOption: string;/);
  assert.match(copy, /readStatusFilterReadOption: string;/);
  assert.match(copy, /readStatusFilterLabel: "Read status"/);

  assert.match(workItem, /WI-0527/i);
  assert.match(workItem, /notice|read status|filter|line budget|helper|employee/i);
  assert.match(roadmap, /WI-0527/i);
}

run()
  .then(() => {
    console.log("e2e-wi0527-employee-notice-read-status-filter-and-line-budget.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
