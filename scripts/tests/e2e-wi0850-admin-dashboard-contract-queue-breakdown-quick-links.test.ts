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
    "WI-0850-admin-dashboard-contract-queue-breakdown-quick-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /href: "\/admin\/contracts\?decisionQueueOnly=true&source=admin-dashboard"/);
  assert.match(adminPage, /href: "\/admin\/contracts\?status=SENT&source=admin-dashboard"/);
  assert.match(adminPage, /href: "\/admin\/contracts\?slaRisk=OVERDUE&source=admin-dashboard"/);
  assert.match(adminPage, /label: isKoLocale \? `의사결정 \$\{summary\.contractDecisionQueueCount\}` : `Decision \$\{summary\.contractDecisionQueueCount\}`/);
  assert.match(adminPage, /label: isKoLocale \? `응답 대기 \$\{summary\.contractPendingResponseCount\}` : `Pending response \$\{summary\.contractPendingResponseCount\}`/);
  assert.match(adminPage, /label: isKoLocale \? `SLA 초과 \$\{summary\.contractSlaOverdueCount\}` : `SLA overdue \$\{summary\.contractSlaOverdueCount\}`/);
  assert.match(adminPage, /badge\.actions\.map\(\(action\) => \(/);

  assert.match(workItem, /WI-0850/i);
  assert.match(workItem, /admin|dashboard|contract|queue|quick|links/i);
  assert.match(roadmap, /WI-0850/i);
}

run();
console.log("e2e-wi0850-admin-dashboard-contract-queue-breakdown-quick-links.test passed");
