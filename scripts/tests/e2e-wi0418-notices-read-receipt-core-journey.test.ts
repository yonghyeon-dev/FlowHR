import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const noticesApiRoute = readUtf8("src", "app", "api", "notices", "route.ts");
  const readRoute = readUtf8("src", "app", "api", "notices", "[noticeId]", "read", "route.ts");
  const noticesStore = readUtf8("src", "features", "notices", "store.ts");
  const noticesSchema = readUtf8("src", "features", "notices", "schemas.ts");
  const employeeBoard = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const noticesCopy = readUtf8("src", "components", "notices", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0418-notices-read-receipt-core-journey.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesStore, /const noticeReadStore: NoticeReadReceipt\[] = \[];/);
  assert.match(noticesStore, /export function listNoticeReadReceipts/);
  assert.match(noticesStore, /export function markNoticeRead/);

  assert.match(noticesSchema, /export const readNoticeSchema = z\.object\(/);

  assert.match(noticesApiRoute, /listNoticeReadReceipts/);
  assert.match(noticesApiRoute, /readNoticeIds/);
  assert.match(noticesApiRoute, /readReceipts/);

  assert.match(readRoute, /export async function POST/);
  assert.match(readRoute, /readNoticeSchema/);
  assert.match(readRoute, /markNoticeRead\(/);

  assert.match(employeeBoard, /parseReadNoticeIds/);
  assert.match(employeeBoard, /parseReadReceipts/);
  assert.match(employeeBoard, /markAsRead/);
  assert.match(employeeBoard, /\/api\/notices\/\$\{encodeURIComponent\(noticeId\)\}\/read/);
  assert.match(employeeBoard, /copy\.markReadAction/);
  assert.match(employeeBoard, /copy\.readBadge/);
  assert.match(employeeBoard, /copy\.unreadBadge/);
  assert.match(employeeBoard, /copy\.unreadLabel/);

  assert.match(noticesCopy, /markReadAction/);
  assert.match(noticesCopy, /readBadge/);
  assert.match(noticesCopy, /unreadBadge/);

  assert.match(workItem, /WI-0418/i);
  assert.match(workItem, /notice|read|receipt|employee|core journey/i);
  assert.match(roadmap, /WI-0418/i);
}

run()
  .then(() => {
    console.log("e2e-wi0418-notices-read-receipt-core-journey.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

