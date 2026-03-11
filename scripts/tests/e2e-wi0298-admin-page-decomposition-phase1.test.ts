import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const queueHelpers = readUtf8("src", "app", "admin", "page-queue-helpers.ts");
  const adminQueueSources = `${adminPage}\n${queueHelpers}`;
  const workItem = readUtf8("work-items", "WI-0298-admin-page-decomposition-phase1.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /from "@\/app\/admin\/page-queue-helpers"/);
  assert.doesNotMatch(adminPage, /buildAdminQueueDerivedState\(\{/);
  assert.match(adminPanels, /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/);
  assert.match(adminQueueSources, /filterPendingAttendanceQueue\(\{/);
  assert.match(adminQueueSources, /filterPendingLeaveQueue\(\{/);
  assert.match(adminQueueSources, /filterPreviewedPayrollQueue\(\{/);
  assert.match(adminQueueSources, /buildQueueSearchSortRows\(\{/);
  assert.match(adminQueueSources, /filterQueueSearchSortRows\(\{/);

  assert.match(queueHelpers, /export function toWaitHoursById/);
  assert.match(queueHelpers, /export function filterPendingAttendanceQueue/);
  assert.match(queueHelpers, /export function filterPendingLeaveQueue/);
  assert.match(queueHelpers, /export function filterPreviewedPayrollQueue/);
  assert.match(queueHelpers, /export function buildQueueSearchSortRows/);
  assert.match(queueHelpers, /export function filterQueueSearchSortRows/);

  assert.match(workItem, /WI-0298/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0298/i);
}

run()
  .then(() => {
    console.log("e2e-wi0298-admin-page-decomposition-phase1.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
