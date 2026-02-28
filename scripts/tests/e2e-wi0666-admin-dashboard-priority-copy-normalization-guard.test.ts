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
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const copyHelper = readUtf8("src", "app", "admin", "page-focus-copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0666-admin-dashboard-priority-copy-normalization-guard.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /from "@\/app\/admin\/page-focus-copy"/);
  assert.match(adminPage, /resolveAdminDashboardPriorityTitle\(locale\)/);
  assert.match(adminPage, /resolveAdminDashboardPriorityDescription\(locale\)/);
  assert.match(adminPage, /resolveAdminDashboardPrioritySummary\(\{/);
  assert.match(adminPage, /resolveAdminDashboardFocusSeverityLabel\(card, locale\)/);

  assert.match(copyHelper, /우선순위 대기열/);
  assert.match(copyHelper, /출퇴근 승인 대기/);
  assert.match(copyHelper, /휴가 승인 대기/);
  assert.match(copyHelper, /급여 프리뷰 대기/);
  assert.match(copyHelper, /긴급/);
  assert.match(copyHelper, /주의/);
  assert.match(copyHelper, /안정/);

  assert.doesNotMatch(copyHelper, /\?닿\?/);
  assert.doesNotMatch(copyHelper, /\?곗/);
  assert.doesNotMatch(copyHelper, /嚥≪뮄/);

  assert.ok(
    countLines(copyHelper) <= 180,
    `page-focus-copy.ts should stay <= 180 lines \(current: ${countLines(copyHelper)}\)`
  );

  assert.match(workItem, /WI-0666/i);
  assert.match(workItem, /admin|dashboard|priority|copy|normalization|guard/i);
  assert.match(roadmap, /WI-0666/i);
}

run()
  .then(() => {
    console.log("e2e-wi0666-admin-dashboard-priority-copy-normalization-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
