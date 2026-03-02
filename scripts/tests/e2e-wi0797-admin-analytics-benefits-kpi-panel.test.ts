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
  const panel = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminBenefitsKpiPanel.tsx"
  );
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0797-admin-analytics-benefits-kpi-panel.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    dashboard,
    /loadBenefitsKpi/,
    "admin KPI dashboard should load benefits KPI snapshot"
  );
  assert.match(
    dashboard,
    /\/api\/benefits\/catalog/,
    "benefits KPI should query benefits catalog API"
  );
  assert.match(
    dashboard,
    /\/api\/benefits\/requests/,
    "benefits KPI should query benefits requests API"
  );
  assert.match(
    dashboard,
    /<AdminBenefitsKpiPanel copy=\{copy\} snapshot=\{benefitsKpi\} \/>/,
    "analytics mode should render benefits KPI panel"
  );

  assert.match(
    panel,
    /buildBenefitsKpiSnapshot/,
    "benefits KPI panel should expose snapshot builder"
  );
  assert.match(
    panel,
    /pendingAging3dCount/,
    "benefits KPI snapshot should include pending aging risk metric"
  );
  assert.match(
    panel,
    /overLimitSubmittedCount/,
    "benefits KPI snapshot should include over-limit submitted metric"
  );

  assert.match(copy, /benefitsPanel:/);

  assert.match(workItem, /WI-0797/i);
  assert.match(workItem, /admin|analytics|benefits|kpi/i);
  assert.match(roadmap, /WI-0797/i);
}

run();
console.log("e2e-wi0797-admin-analytics-benefits-kpi-panel.test passed");
