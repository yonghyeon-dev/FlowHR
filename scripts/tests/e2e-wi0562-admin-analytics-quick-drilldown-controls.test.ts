import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const sections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0562-admin-analytics-quick-drilldown-controls.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(sections, /const analyticsDrilldownMetrics: .* = \[/);
  assert.match(sections, /copy\.quickDrilldownLabel/);
  assert.match(sections, /copy\.quickDrilldownAllAction/);
  assert.match(sections, /onFocusMetricChange\("all"\)/);
  assert.match(sections, /analyticsDrilldownMetrics\.map/);
  assert.match(sections, /copy\.metrics\[metric\]/);

  assert.match(copy, /quickDrilldownLabel: string;/);
  assert.match(copy, /quickDrilldownAllAction: string;/);
  assert.match(copy, /quickDrilldownLabel: "Quick drilldown"/);
  assert.match(copy, /quickDrilldownLabel: "빠른 드릴다운"/);

  assert.ok(
    countLines(sections) <= 300,
    `AdminKpiSections.tsx should stay <= 300 lines (current: ${countLines(sections)})`
  );
  assert.ok(
    countLines(dashboard) <= 300,
    `AdminKpiDashboard.tsx should stay <= 300 lines (current: ${countLines(dashboard)})`
  );

  assert.match(workItem, /WI-0562/i);
  assert.match(workItem, /admin|analytics|quick drilldown|controls/i);
  assert.match(roadmap, /WI-0562/i);
}

run()
  .then(() => {
    console.log("e2e-wi0562-admin-analytics-quick-drilldown-controls.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
