import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const approvalQueuePage = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0856-admin-approval-dashboard-open-link-stalled-filter-fix.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    approvalQueuePage,
    /normalizePositiveIntegerText\(searchParams\.get\("stalledHoursMin"\), "24"\)/
  );
  assert.match(approvalQueuePage, /source === "admin-dashboard"/);
  assert.match(approvalQueuePage, /searchParams\.get\("stalledHoursMin"\) === null/);
  assert.match(approvalQueuePage, /normalizeApprovalStateFilter\(searchParams\.get\("state"\)\) === "PENDING"/);
  assert.match(approvalQueuePage, /setStalledHoursMin\("0"\)/);
  assert.match(approvalQueuePage, /const stalledHoursRiskThreshold = useMemo/);
  assert.match(approvalQueuePage, /stalledHoursThreshold > 0 \? stalledHoursThreshold : 24/);
  assert.match(approvalQueuePage, /stalledHours >= stalledHoursRiskThreshold/);
  assert.match(approvalQueuePage, /stalledHoursThreshold=\{stalledHoursRiskThreshold\}/);

  assert.match(workItem, /WI-0856/i);
  assert.match(workItem, /approval|dashboard|open|queue|stalled|filter/i);
  assert.match(roadmap, /WI-0856/i);
}

run();
console.log("e2e-wi0856-admin-approval-dashboard-open-link-stalled-filter-fix.test passed");
