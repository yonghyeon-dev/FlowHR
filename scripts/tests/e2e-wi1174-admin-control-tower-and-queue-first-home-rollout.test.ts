import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1174-admin-control-tower-and-queue-first-home-rollout.md"
  );

  assert.match(adminPage, /RouteWorkspaceShell/);
  assert.match(adminPage, /RouteWorkspaceHeader/);
  assert.match(adminPage, /RouteWorkspaceSummary/);
  assert.match(adminPage, /RouteWorkspaceSplit/);
  assert.match(adminPage, /RouteWorkspaceSectionCard/);
  assert.match(
    adminPage,
    /className="admin-hub-shell admin-control-tower-shell"/
  );
  assert.match(adminPage, /title=\{isKoLocale \? "관리자 허브" : "Admin hub"\}/);
  assert.match(adminPage, /title=\{isKoLocale \? "오늘의 대기열" : "Today queue"\}/);
  assert.match(adminPage, /title=\{isKoLocale \? "운영 레인" : "Operations lanes"\}/);
  assert.match(adminPage, /title=\{isKoLocale \? "조직 스냅샷" : "Org snapshot"\}/);
  assert.match(adminPage, /title=\{isKoLocale \? "예외 모니터" : "Exception monitor"\}/);
  assert.match(adminPage, /title=\{isKoLocale \? "문서 · 급여 watch" : "Documents · payroll watch"\}/);
  assert.match(adminPage, /dashboardEntryLinks\.map/);
  assert.match(adminPage, /workspaceLaneCards\.map/);
  assert.match(adminPage, /todayQueueItems\.map/);

  assert.match(globalsCss, /\.admin-control-tower-shell \{/);
  assert.match(globalsCss, /\.admin-control-tower-queue-card \{/);
  assert.match(globalsCss, /\.admin-control-tower-side-card \{/);
  assert.match(globalsCss, /\.admin-control-tower-focus-strip \{/);

  assert.match(workItem, /queue-first customer-admin operating station/);
}

run();
console.log("e2e-wi1174-admin-control-tower-and-queue-first-home-rollout.test passed");
