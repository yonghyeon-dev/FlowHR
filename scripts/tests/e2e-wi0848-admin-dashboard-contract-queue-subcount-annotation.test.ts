import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0848-admin-dashboard-contract-queue-subcount-annotation.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /breakdown: isKoLocale/);
  assert.match(adminPage, /의사결정 \$\{summary\.contractDecisionQueueCount\}/);
  assert.match(adminPage, /응답 대기 \$\{summary\.contractPendingResponseCount\}/);
  assert.match(adminPage, /SLA 초과 \$\{summary\.contractSlaOverdueCount\}/);
  assert.match(adminPage, /Pending response \$\{summary\.contractPendingResponseCount\}/);
  assert.match(adminPage, /<small>\{badge\.breakdown\}<\/small>/);

  assert.match(workItem, /WI-0848/i);
  assert.match(workItem, /admin|dashboard|contract|queue|subcount|annotation/i);
  assert.match(roadmap, /WI-0848/i);
}

run();
console.log("e2e-wi0848-admin-dashboard-contract-queue-subcount-annotation.test passed");
