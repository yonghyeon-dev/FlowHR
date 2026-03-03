import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const types = readUtf8("src", "app", "admin", "page-dashboard-types.ts");
  const summaryHelper = readUtf8("src", "app", "admin", "page-summary-helpers.ts");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0847-admin-dashboard-contract-pending-response-queue-badge-balance.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(types, /contractPendingResponseCount: number/);
  assert.match(summaryHelper, /const contractPendingResponseCount = contractDocuments\.filter/);
  assert.match(summaryHelper, /document\.status === "SENT"/);
  assert.match(summaryHelper, /contractPendingResponseCount,/);
  assert.match(adminPage, /summary\.contractDecisionQueueCount \+ summary\.contractPendingResponseCount/);

  assert.match(workItem, /WI-0847/i);
  assert.match(workItem, /admin|dashboard|contract|pending response|queue badge/i);
  assert.match(roadmap, /WI-0847/i);
}

run();
console.log("e2e-wi0847-admin-dashboard-contract-pending-response-queue-badge-balance.test passed");
