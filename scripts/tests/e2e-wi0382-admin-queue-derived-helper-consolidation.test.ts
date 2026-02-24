import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const queueHelpers = readUtf8("src", "app", "admin", "page-queue-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0382-admin-queue-derived-helper-consolidation.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(queueHelpers, /export function buildAdminQueueDerivedState/);
  assert.match(queueHelpers, /toQueueAlertLevelByRule/);
  assert.match(adminPage, /buildAdminQueueDerivedState\(\{/);

  assert.doesNotMatch(adminPage, /const attendanceWaitHoursById = useMemo/);
  assert.doesNotMatch(adminPage, /const queueSearchSortRows = useMemo/);

  assert.match(workItem, /WI-0382/i);
  assert.match(workItem, /queue derived helper/i);
  assert.match(roadmap, /WI-0382/i);
}

run()
  .then(() => {
    console.log("e2e-wi0382-admin-queue-derived-helper-consolidation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
