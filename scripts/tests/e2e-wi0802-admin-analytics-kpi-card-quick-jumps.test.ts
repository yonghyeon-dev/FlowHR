import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminKpiDashboard.tsx"
  );
  const sections = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminKpiSections.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0802-admin-analytics-kpi-card-quick-jumps.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /adminKpiDrilldownMetrics/);
  assert.match(dashboard, /appendAnalyticsSourceQuery/);
  assert.match(dashboard, /new URLSearchParams\(\{ source: "admin-analytics" \}\)/);
  assert.match(dashboard, /contextParams\.set\("focusMetric", focusMetric\)/);
  assert.match(dashboard, /cardQuickLinks/);
  assert.match(dashboard, /<AdminKpiCards copy=\{copy\} kpi=\{currentRangeKpi\} quickLinks=\{cardQuickLinks\} \/>/);

  assert.match(sections, /type AdminKpiCardQuickLink/);
  assert.match(sections, /quickLinks\?: AdminKpiCardQuickLinkMap/);
  assert.match(sections, /function KpiCardQuickJump/);
  assert.match(sections, /copy\.focusWorkspaceOpenAction/);
  assert.match(sections, /quickLinks\?\.pendingApprovals/);
  assert.match(sections, /quickLinks\?\.contractSlaOverdueCount/);

  assert.match(workItem, /WI-0802/i);
  assert.match(workItem, /admin|analytics|kpi|quick|workspace/i);
  assert.match(roadmap, /WI-0802/i);
}

run();
console.log("e2e-wi0802-admin-analytics-kpi-card-quick-jumps.test passed");
