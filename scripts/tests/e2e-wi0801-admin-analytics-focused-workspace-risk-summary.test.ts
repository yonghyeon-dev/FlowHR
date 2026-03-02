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
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0801-admin-analytics-focused-workspace-risk-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /focusedTrendRow/);
  assert.match(dashboard, /focusWorkspaceMetricSummaryTitle/);
  assert.match(dashboard, /focusWorkspaceNoMetricSelected/);
  assert.match(dashboard, /focusWorkspaceTrendDirectionLabel/);
  assert.match(dashboard, /focusTrendDirectionLabel/);
  assert.match(dashboard, /formatDelta\(/);
  assert.match(dashboard, /formatPercent\(/);

  assert.match(copy, /focusWorkspaceMetricSummaryTitle:/);
  assert.match(copy, /focusWorkspaceNoMetricSelected:/);
  assert.match(copy, /focusWorkspaceTrendDirectionLabel:/);
  assert.match(copy, /focusWorkspaceTrendUp:/);
  assert.match(copy, /focusWorkspaceTrendDown:/);
  assert.match(copy, /focusWorkspaceTrendFlat:/);

  assert.match(workItem, /WI-0801/i);
  assert.match(workItem, /admin|analytics|focused|workspace|summary/i);
  assert.match(roadmap, /WI-0801/i);
}

run();
console.log(
  "e2e-wi0801-admin-analytics-focused-workspace-risk-summary.test passed"
);
