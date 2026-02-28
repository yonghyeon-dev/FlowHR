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
  const focusHelpers = readUtf8("src", "app", "admin", "page-focus-cards.ts");
  const workItem = readUtf8("work-items", "WI-0665-admin-dashboard-priority-focus-cards-ux.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /from "@\/app\/admin\/page-focus-cards"/);
  assert.match(adminPage, /buildAdminDashboardFocusCards\(summary\)/);
  assert.match(adminPage, /summarizeAdminDashboardFocusCards\(focusCards\)/);
  assert.match(adminPage, /resolveAdminDashboardPriorityTitle\(locale\)/);
  assert.match(adminPage, /resolveAdminDashboardFocusCardLabel\(card, locale\)/);

  assert.match(focusHelpers, /export type AdminDashboardFocusCard = \{/);
  assert.match(focusHelpers, /export function buildAdminDashboardFocusCards\(/);
  assert.match(focusHelpers, /export function summarizeAdminDashboardFocusCards\(/);
  assert.match(focusHelpers, /href: "\/admin\/attendance-live"/);
  assert.match(focusHelpers, /href: "\/admin\/approval-executions"/);
  assert.match(focusHelpers, /href: "\/admin\/payroll-year-end"/);

  assert.ok(
    countLines(adminPage) <= 360,
    `admin/page.tsx should stay <= 360 lines \(current: ${countLines(adminPage)}\)`
  );
  assert.ok(
    countLines(focusHelpers) <= 140,
    `page-focus-cards.ts should stay <= 140 lines \(current: ${countLines(focusHelpers)}\)`
  );

  assert.match(workItem, /WI-0665/i);
  assert.match(workItem, /admin|dashboard|priority|focus|cards|ux/i);
  assert.match(roadmap, /WI-0665/i);
}

run()
  .then(() => {
    console.log("e2e-wi0665-admin-dashboard-priority-focus-cards-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
