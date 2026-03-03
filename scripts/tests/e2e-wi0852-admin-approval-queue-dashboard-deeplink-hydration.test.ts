import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminDashboardPage = readUtf8("src", "app", "admin", "page.tsx");
  const approvalQueuePage = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0852-admin-approval-queue-dashboard-deeplink-hydration.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminDashboardPage, /href: "\/admin\/approval-executions\?state=PENDING&source=admin-dashboard"/);
  assert.match(adminDashboardPage, /href: "\/admin\/approval-executions\?state=PENDING&stalledHoursMin=24&source=admin-dashboard"/);

  assert.match(approvalQueuePage, /const searchParams = useSearchParams\(\)/);
  assert.match(approvalQueuePage, /const source = searchParams\.get\("source"\)/);
  assert.match(approvalQueuePage, /normalizeApprovalStateFilter\(searchParams\.get\("state"\)\)/);
  assert.match(approvalQueuePage, /normalizeApprovalSortFilter\(searchParams\.get\("sort"\)\)/);
  assert.match(approvalQueuePage, /normalizePositiveIntegerText\(searchParams\.get\("stalledHoursMin"\), "24"\)/);
  assert.match(approvalQueuePage, /source === "admin-dashboard"/);
  assert.match(approvalQueuePage, /Focused queue/);
  assert.match(approvalQueuePage, /정체 결재 대기함/);

  assert.match(workItem, /WI-0852/i);
  assert.match(workItem, /admin|approval|queue|dashboard|deeplink/i);
  assert.match(roadmap, /WI-0852/i);
}

run();
console.log("e2e-wi0852-admin-approval-queue-dashboard-deeplink-hydration.test passed");
