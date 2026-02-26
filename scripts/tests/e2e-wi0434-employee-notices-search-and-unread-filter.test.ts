import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeNoticeBoard = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const employeeNoticeBoardList = readUtf8(
    "src",
    "components",
    "notices",
    "EmployeeNoticeBoardList.tsx"
  );
  const employeeNoticeBoardHelpers = readUtf8(
    "src",
    "components",
    "notices",
    "employee-notice-board-helpers.ts"
  );
  const noticesCopy = readUtf8("src", "components", "notices", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0434-employee-notices-search-and-unread-filter.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeNoticeBoard, /const \[searchQuery, setSearchQuery\] = useState\(""\);/);
  assert.match(employeeNoticeBoard, /const \[unreadOnly, setUnreadOnly\] = useState\(false\);/);
  assert.match(employeeNoticeBoard, /const filteredNotices = useMemo\(/);
  assert.match(employeeNoticeBoard, /type="checkbox"/);
  assert.match(employeeNoticeBoard, /copy\.searchLabel/);
  assert.match(employeeNoticeBoard, /copy\.unreadOnlyLabel/);
  assert.match(employeeNoticeBoard, /copy\.clearFiltersAction/);
  assert.match(employeeNoticeBoard, /copy\.filteredSummaryLabel/);
  assert.match(employeeNoticeBoard, /copy\.readStatusFilterLabel/);
  assert.match(employeeNoticeBoard, /normalizeEmployeeNoticeReadStatusFilter/);
  assert.match(employeeNoticeBoard, /<EmployeeNoticeBoardList/);

  assert.match(employeeNoticeBoardList, /filteredNotices\.map\(\(notice\) => \{/);
  assert.match(employeeNoticeBoardList, /copy\.filteredListEmpty/);
  assert.match(employeeNoticeBoardHelpers, /notice\.title\.toLowerCase\(\)/);
  assert.match(employeeNoticeBoardHelpers, /notice\.body\.toLowerCase\(\)/);

  assert.match(noticesCopy, /searchLabel: string;/);
  assert.match(noticesCopy, /searchPlaceholder: string;/);
  assert.match(noticesCopy, /readStatusFilterLabel: string;/);
  assert.match(noticesCopy, /readStatusFilterUnreadOption: string;/);
  assert.match(noticesCopy, /unreadOnlyLabel: string;/);
  assert.match(noticesCopy, /clearFiltersAction: string;/);
  assert.match(noticesCopy, /filteredSummaryLabel: string;/);
  assert.match(noticesCopy, /filteredListEmpty: string;/);
  assert.match(noticesCopy, /searchLabel: "\uAC80\uC0C9\uC5B4"/);
  assert.match(noticesCopy, /unreadOnlyLabel: "\uBBF8\uD655\uC778 \uACF5\uC9C0\uB9CC \uBCF4\uAE30"/);
  assert.match(noticesCopy, /readStatusFilterLabel: "\uC77D\uC74C \uC0C1\uD0DC"/);
  assert.match(noticesCopy, /searchLabel: "Search"/);
  assert.match(noticesCopy, /unreadOnlyLabel: "Unread only"/);
  assert.match(noticesCopy, /readStatusFilterLabel: "Read status"/);

  assert.match(workItem, /WI-0434/i);
  assert.match(workItem, /notices|search|unread|filter|employee/i);
  assert.match(roadmap, /WI-0434/i);
}

run()
  .then(() => {
    console.log("e2e-wi0434-employee-notices-search-and-unread-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
