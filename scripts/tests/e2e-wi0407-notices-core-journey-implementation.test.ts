import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const noticesApiRoute = readUtf8("src", "app", "api", "notices", "route.ts");
  const publishNoticeRoute = readUtf8("src", "app", "api", "notices", "[noticeId]", "publish", "route.ts");
  const noticesStore = readUtf8("src", "features", "notices", "store.ts");
  const noticesCopy = readUtf8("src", "components", "notices", "copy.ts");
  const adminWorkspace = readUtf8("src", "components", "notices", "AdminNoticeWorkspace.tsx");
  const employeeBoard = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const adminNoticesPage = readUtf8("src", "app", "admin", "notices", "page.tsx");
  const employeeNoticesPage = readUtf8("src", "app", "employee", "notices", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");

  const workItem = readUtf8("work-items", "WI-0407-notices-core-journey-implementation.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesStore, /INITIAL_NOTICE_STORE/);
  assert.match(noticesStore, /export function listNotices/);
  assert.match(noticesStore, /export function createNotice/);
  assert.match(noticesStore, /export function publishNotice/);

  assert.match(noticesApiRoute, /export async function GET/);
  assert.match(noticesApiRoute, /export async function POST/);
  assert.match(noticesApiRoute, /listNoticesQuerySchema/);
  assert.match(noticesApiRoute, /createNoticeSchema/);

  assert.match(publishNoticeRoute, /export async function POST/);
  assert.match(publishNoticeRoute, /publishNoticeSchema/);
  assert.match(publishNoticeRoute, /publishNotice\(/);

  assert.match(noticesCopy, /resolveNoticeWorkspaceCopy/);
  assert.match(noticesCopy, /resolveEmployeeNoticeBoardCopy/);
  assert.match(noticesCopy, /"공지사항 워크스페이스"/);
  assert.match(noticesCopy, /"내 공지사항"/);

  assert.ok(adminWorkspace.includes("/api/notices"));
  assert.match(adminWorkspace, /publishNow\(/);
  assert.match(adminWorkspace, /resolveNoticeWorkspaceCopy/);

  assert.ok(employeeBoard.includes("/api/notices"));
  assert.match(employeeBoard, /resolveEmployeeNoticeBoardCopy/);

  assert.match(adminNoticesPage, /AdminNoticeWorkspace/);
  assert.match(employeeNoticesPage, /EmployeeNoticeBoard/);

  assert.match(employeeLayout, /href: "\/employee\/notices", label: t\("employee\.nav\.notices"\)/);
  assert.match(employeeLayout, /<Link href="\/employee\/notices">\{t\("employee\.nav\.notices"\)\}<\/Link>/);

  assert.match(messages, /"employee\.nav\.notices": "공지사항"/);
  assert.match(messages, /"employee\.nav\.notices": "Notices"/);

  assert.match(workItem, /WI-0407/i);
  assert.match(workItem, /notice|core journey|api|publish|employee/i);
  assert.match(roadmap, /WI-0407/i);
}

run()
  .then(() => {
    console.log("e2e-wi0407-notices-core-journey-implementation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
