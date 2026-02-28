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
  const adminQueueSources = `${adminPanels}\n${queueHelpers}`;
  const workItem = readUtf8("work-items", "WI-0344-admin-page-decomposition-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(adminPage, /summarizeAdminApiLogs\(logs\)/);
  assert.doesNotMatch(adminPage, /buildAdminQueueDerivedState\(\{/);
  assert.match(adminPanels, /from "@\/app\/admin\/page-queue-helpers"/);
  assert.match(adminPanels, /queueDerivedState: ReturnType<typeof buildAdminQueueDerivedState>/);
  assert.match(adminQueueSources, /buildQueueBadgeSummaries\(\{/);
  assert.match(adminQueueSources, /summarizeQueueAlertOverview\(queueBadgeSummaries\)/);
  assert.doesNotMatch(adminPage, /const total = logs\.length;\s*const success = logs\.filter/);

  assert.match(queueHelpers, /export function summarizeAdminApiLogs/);
  assert.match(queueHelpers, /export function buildQueueBadgeSummaries/);
  assert.match(queueHelpers, /export function summarizeQueueAlertOverview/);

  assert.match(workItem, /WI-0344/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0344/i);
}

run()
  .then(() => {
    console.log("e2e-wi0344-admin-page-decomposition-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
