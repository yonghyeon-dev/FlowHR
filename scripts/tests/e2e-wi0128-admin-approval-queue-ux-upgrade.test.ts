import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPageSource = readUtf8("src", "app", "admin", "page.tsx");
  const approvalExecutionsPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page.tsx"
  );
  const retiredPanelsSource = readUtf8("src", "app", "admin", "page-panels.tsx");
  const approvalQueuePanelSource = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueuePanel.tsx"
  );
  const approvalQueueSearchSortSource = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueSearchSortPanel.tsx"
  );
  const queueUiSource = [
    adminPageSource,
    approvalQueuePanelSource,
    approvalQueueSearchSortSource
  ].join("\n");
  const globalCssSource = readUtf8("src", "app", "globals.css");

  assert.ok(
    /ApprovalQueuePanel/.test(adminPageSource) ||
      /<AdminDashboardPanels/.test(adminPageSource) ||
      /href="\/admin\/approval-executions"/.test(adminPageSource),
    "admin page should expose approval queue directly, via orchestrator, or via dedicated approval workspace shortcut"
  );
  assert.match(
    retiredPanelsSource,
    /ADMIN_DASHBOARD_PANELS_RETIRED_WI_1136/,
    "legacy admin panel orchestrator should be explicitly retired after route-first migration"
  );
  assert.match(queueUiSource, /승인 큐 필터/, "admin approvals panel should expose queue focus badges");
  assert.match(queueUiSource, /큐 검색/, "admin approvals panel should expose queue search input");
  assert.match(
    approvalExecutionsPageSource,
    /const \[sort, setSort\] = useState<ApprovalExecutionSort>\("priority_desc"\)/,
    "dedicated approval workspace should support queue sorting"
  );

  assert.match(globalCssSource, /\.approval-queue-header/, "queue header styling should exist");
  assert.match(globalCssSource, /\.queue-badge-strip/, "queue badge strip styling should exist");
  assert.match(globalCssSource, /#approvals \.simple-list li/, "mobile approval queue list layout should be responsive");
}

run();
console.log("e2e-wi0128-admin-approval-queue-ux-upgrade.test passed");
