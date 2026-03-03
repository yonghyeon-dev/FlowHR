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
    "WI-0849-admin-dashboard-contract-queue-subcount-korean-terminology-lock.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /응답 대기 \$\{summary\.contractPendingResponseCount\}/);
  assert.match(adminPage, /SLA 초과 \$\{summary\.contractSlaOverdueCount\}/);
  assert.doesNotMatch(adminPage, /응답대기 \$\{summary\.contractPendingResponseCount\}/);
  assert.doesNotMatch(adminPage, /SLA초과 \$\{summary\.contractSlaOverdueCount\}/);

  assert.match(workItem, /WI-0849/i);
  assert.match(workItem, /admin|dashboard|contract|queue|korean|terminology/i);
  assert.match(roadmap, /WI-0849/i);
}

run();
console.log("e2e-wi0849-admin-dashboard-contract-queue-subcount-korean-terminology-lock.test passed");
