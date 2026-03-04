import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const queueBadges = readUtf8("src", "app", "admin", "page-queue-badges.ts");
  const workItem = readUtf8("work-items", "WI-0879-admin-dashboard-line-budget-recovery.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /from "@\/app\/admin\/page-queue-badges"/);
  assert.match(adminPage, /buildAdminQueueBadges\(summary, isKoLocale\)/);
  assert.match(adminPage, /topFocusCard/);
  assert.match(adminPage, /workspaceHubs\.map/);
  assert.ok(
    countLines(adminPage) <= 360,
    `admin/page.tsx should stay <= 360 lines (current: ${countLines(adminPage)})`
  );

  assert.match(queueBadges, /export function buildAdminQueueBadges\(/);
  assert.match(queueBadges, /approval-executions\?source=admin-dashboard/);
  assert.match(queueBadges, /payroll-close\?source=admin-dashboard/);
  assert.match(queueBadges, /contracts\?source=admin-dashboard/);

  assert.match(workItem, /WI-0879/i);
  assert.match(workItem, /admin|dashboard|line budget|queue badges|recovery/i);
  assert.match(roadmap, /WI-0879/i);
}

run();
console.log("e2e-wi0879-admin-dashboard-line-budget-recovery.test passed");
