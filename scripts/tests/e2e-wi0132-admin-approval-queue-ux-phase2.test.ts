import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(adminPage, /검색 범위/, "approval queue should provide search scope selector");
  assert.match(adminPage, /긴급만 보기/, "approval queue should provide urgent-only quick filter");
  assert.match(adminPage, /정체 우선순/, "approval queue should provide stale-priority sort option");
  assert.match(adminPage, /모바일 빠른 승인 액션/, "approval queue should provide mobile quick action bar");
  assert.match(adminPage, /queueAlertOverview/, "approval queue should compute alert overview summary");

  assert.match(globalCss, /\.queue-badge-alert/, "queue badge alert styling should exist");
  assert.match(globalCss, /\.queue-alert-strip/, "queue alert strip styling should exist");
  assert.match(globalCss, /\.queue-toggle-chip/, "queue quick-filter chip styling should exist");
  assert.match(globalCss, /\.queue-sla-chip/, "queue wait-time chip styling should exist");
  assert.match(globalCss, /\.queue-mobile-sticky/, "queue mobile sticky action styling should exist");
}

run();
console.log("e2e-wi0132-admin-approval-queue-ux-phase2.test passed");
