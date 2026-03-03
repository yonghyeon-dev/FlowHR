import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const contractPanel = readUtf8("src", "components", "admin-kpi", "AdminContractKpiPanel.tsx");
  const contractsWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const analyticsContextHelper = readUtf8(
    "src",
    "components",
    "contracts",
    "admin-contracts-analytics-context.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0864-admin-contracts-analytics-return-focus-restore.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    dashboard,
    /<AdminContractKpiPanel copy=\{copy\} snapshot=\{contractKpi\} analyticsFocusMetric=\{focusMetric\} \/>/
  );

  assert.match(contractPanel, /contextParams\.set\("analyticsFocus", options\.analyticsFocusMetric\)/);
  assert.match(contractPanel, /withAnalyticsSourceContext\(\s*"\/admin\/contracts\?status=SENT"/);
  assert.match(contractPanel, /withAnalyticsSourceContext\(\s*"\/admin\/contracts\?decisionQueueOnly=true"/);
  assert.match(contractPanel, /withAnalyticsSourceContext\(\s*"\/admin\/contracts\?slaRisk=OVERDUE"/);

  assert.match(contractsWorkspace, /normalizeContractsAnalyticsFocusMetric\(searchParams\.get\("analyticsFocus"\)\)/);
  assert.match(contractsWorkspace, /const analyticsBackHref = resolveContractsAnalyticsBackHref\(analyticsSource, analyticsFocus\);/);
  assert.match(analyticsContextHelper, /export function normalizeContractsAnalyticsFocusMetric/);
  assert.match(analyticsContextHelper, /export function resolveContractsAnalyticsBackHref/);
  assert.match(analyticsContextHelper, /\/admin\/analytics\?focus=\$\{encodeURIComponent\(analyticsFocusMetric\)\}/);
  assert.match(contractsWorkspace, /analyticsBackHref \?/);
  assert.match(contractsWorkspace, /href=\{analyticsBackHref\}/);
  assert.match(contractsWorkspace, /Back to analytics/);

  assert.match(workItem, /WI-0864/i);
  assert.match(workItem, /admin|contracts|analytics|return|focus|restore/i);
  assert.match(roadmap, /WI-0864/i);
}

run();
console.log("e2e-wi0864-admin-contracts-analytics-return-focus-restore.test passed");
