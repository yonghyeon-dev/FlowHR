import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPageSource = readUtf8("src", "app", "admin", "page.tsx");
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
  const queueUiSource = [adminPageSource, approvalQueuePanelSource, approvalQueueSearchSortSource].join("\n");
  const globalCssSource = readUtf8("src", "app", "globals.css");

  assert.match(
    adminPageSource,
    /ApprovalQueuePanel/,
    "admin page should delegate approval queue panel rendering to extracted component"
  );
  assert.match(queueUiSource, /승인 큐 필터/, "admin approvals panel should expose queue focus badges");
  assert.match(queueUiSource, /큐 검색/, "admin approvals panel should expose queue search input");
  assert.match(adminPageSource, /attendanceQueueSort/, "admin approvals panel should support attendance sorting");
  assert.match(adminPageSource, /leaveQueueSort/, "admin approvals panel should support leave sorting");
  assert.match(adminPageSource, /payrollQueueSort/, "admin approvals panel should support payroll sorting");

  assert.match(globalCssSource, /\.approval-queue-header/, "queue header styling should exist");
  assert.match(globalCssSource, /\.queue-badge-strip/, "queue badge strip styling should exist");
  assert.match(globalCssSource, /#approvals \.simple-list li/, "mobile approval queue list layout should be responsive");
}

run();
console.log("e2e-wi0128-admin-approval-queue-ux-upgrade.test passed");
