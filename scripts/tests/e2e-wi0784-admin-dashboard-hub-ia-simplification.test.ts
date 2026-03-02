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
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0784-admin-dashboard-hub-ia-simplification.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");

  assert.match(roadmap, /WI-0784/);
  assert.match(workItem, /Admin Dashboard Hub IA Simplification/i);

  assert.match(adminPage, /topFocusCard/);
  assert.match(adminPage, /Today's top priority/);
  assert.match(adminPage, /오늘의 우선 처리/);
  assert.match(adminPage, /핵심 워크스페이스 허브/);
  assert.match(adminPage, /workspaceHubs\.map/);
  assert.match(adminPage, /hub\.links\.map/);

  assert.ok(
    !adminPage.includes('className="btn btn-secondary" href="/login"'),
    "header login shortcut should be removed from admin dashboard"
  );

  assert.ok(
    countLines(adminPage) <= 360,
    `admin/page.tsx should stay <= 360 lines (current: ${countLines(adminPage)})`
  );
}

run()
  .then(() => {
    console.log("e2e-wi0784-admin-dashboard-hub-ia-simplification.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
