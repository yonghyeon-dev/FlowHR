import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const board = readUtf8("src", "components", "notices", "EmployeeNoticeBoard.tsx");
  const schemas = readUtf8("src", "features", "notices", "schemas.ts");
  const route = readUtf8("src", "app", "api", "notices", "read-all", "route.ts");
  const store = readUtf8("src", "features", "notices", "store.ts");
  const workItem = readUtf8("work-items", "WI-0810-employee-notices-scoped-mark-all-read.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(board, /const visibleUnreadNoticeIds = useMemo\(/);
  assert.match(board, /const shouldScopeMarkAllRead =/);
  assert.match(board, /payload: \{ organizationId: string; noticeIds\?: string\[] \}/);
  assert.match(board, /payload\.noticeIds = visibleUnreadNoticeIds/);
  assert.match(board, /disabled=\{pending \|\| visibleUnreadNoticeIds\.length === 0\}/);

  assert.match(schemas, /noticeIds: z\.array\(z\.string\(\)\.trim\(\)\.min\(1\)\)\.max\(500\)\.optional\(\)/);
  assert.match(route, /noticeIds: payload\.noticeIds/);
  assert.match(route, /noticeIds: parsed\.data\.noticeIds/);
  assert.match(store, /noticeIds\?: string\[];/);
  assert.match(store, /const targetNoticeIdSet = input\.noticeIds/);
  assert.match(store, /const targetNotices =/);
  assert.match(store, /targetNotices\.map\(\(notice\) =>/);

  assert.match(workItem, /WI-0810/i);
  assert.match(workItem, /employee|notices|scoped|mark all|read/i);
  assert.match(roadmap, /WI-0810/i);
}

run();
console.log("e2e-wi0810-employee-notices-scoped-mark-all-read.test passed");
