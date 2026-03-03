import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminDashboardPage = readUtf8("src", "app", "admin", "page.tsx");
  const contractsWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0851-admin-contracts-dashboard-source-banner.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminDashboardPage, /source=admin-dashboard/);

  assert.match(contractsWorkspace, /analyticsSource === "admin-dashboard"/);
  assert.match(contractsWorkspace, /copy\.dashboardSourceBanner/);
  assert.match(contractsWorkspace, /copy\.dashboardSourceFocusLabel/);
  assert.match(contractsWorkspace, /const dashboardFocusLabel = decisionQueueOnly/);
  assert.match(contractsWorkspace, /documentStatusFilter === "SENT"/);
  assert.match(contractsWorkspace, /slaRiskFilter === "OVERDUE"/);
  assert.match(contractsWorkspace, /copy\.pendingResponseQueueLabel/);

  assert.match(copy, /dashboardSourceBanner: "Opened from admin dashboard"/);
  assert.match(copy, /dashboardSourceBanner: "관리자 대시보드에서 이동했습니다"/);
  assert.match(copy, /pendingResponseQueueLabel: "Pending response"/);
  assert.match(copy, /pendingResponseQueueLabel: "응답 대기"/);

  assert.match(workItem, /WI-0851/i);
  assert.match(workItem, /admin|contracts|dashboard|source|banner/i);
  assert.match(roadmap, /WI-0851/i);
}

run();
console.log("e2e-wi0851-admin-contracts-dashboard-source-banner.test passed");
