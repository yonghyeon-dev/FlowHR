import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const noticesSchemas = readUtf8("src", "features", "notices", "schemas.ts");
  const noticesStore = readUtf8("src", "features", "notices", "store.ts");
  const readAllRoute = readUtf8("src", "app", "api", "notices", "read-all", "route.ts");
  const employeeBoard = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const noticesCopy = readUtf8("src", "components", "notices", "copy.ts");

  const workItem = readUtf8("work-items", "WI-0423-notices-mark-all-read-core-journey.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(noticesSchemas, /export const readAllNoticesSchema = z\.object\(/);
  assert.match(noticesStore, /export function markAllNoticesRead\(/);
  assert.match(readAllRoute, /markAllNoticesRead/);
  assert.match(readAllRoute, /export async function POST\(request: Request\)/);
  assert.match(readAllRoute, /readNoticeIds/);
  assert.match(readAllRoute, /count: receipts\.length/);

  assert.match(employeeBoard, /async function markAllAsRead\(\)/);
  assert.match(employeeBoard, /fetch\("\/api\/notices\/read-all"/);
  assert.match(employeeBoard, /copy\.markAllReadAction/);
  assert.match(employeeBoard, /copy\.messages\.markedAllRead/);
  assert.match(employeeBoard, /copy\.messages\.markAllReadFailed/);

  assert.match(noticesCopy, /markAllReadAction/);
  assert.match(noticesCopy, /markedAllRead/);
  assert.match(noticesCopy, /markAllReadFailed/);

  assert.match(workItem, /WI-0423/i);
  assert.match(workItem, /notice|mark all|read|employee|core journey/i);
  assert.match(roadmap, /WI-0423/i);
}

run()
  .then(() => {
    console.log("e2e-wi0423-notices-mark-all-read-core-journey.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
