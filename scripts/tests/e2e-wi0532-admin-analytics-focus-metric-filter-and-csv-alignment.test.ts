import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const utils = readUtf8("src", "components", "admin-kpi", "dashboard-utils.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0532-admin-analytics-focus-metric-filter-and-csv-alignment.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /const \[focusMetric, setFocusMetric\] = useState<AdminKpiFocusMetric>\("all"\)/);
  assert.match(dashboard, /const visibleTrendRows = useMemo/);
  assert.match(dashboard, /row\.key === focusMetric/);
  assert.match(dashboard, /AdminKpiAnalyticsControls/);
  assert.match(dashboard, /exportButtonLabel=\{copy\.exportCsvButton\}/);
  assert.match(dashboard, /trendRows: visibleTrendRows/);
  assert.match(dashboard, /focusMetric,/);

  assert.match(sections, /export type AdminKpiFocusMetric =/);
  assert.match(sections, /export function AdminKpiAnalyticsControls/);
  assert.match(sections, /copy\.focusMetricLabel/);
  assert.match(sections, /copy\.focusMetricAllOption/);
  assert.match(sections, /copy\.metrics\.pendingApprovals/);
  assert.match(sections, /exportButtonLabel: string;/);
  assert.match(sections, /\{exportButtonLabel\}/);

  assert.match(copy, /focusMetricLabel:/);
  assert.match(copy, /focusMetricAllOption:/);
  assert.match(copy, /focusMetricLabel: "집중 지표"/);
  assert.match(copy, /focusMetricLabel: "Focus metric"/);

  assert.match(utils, /focusMetric: string;/);
  assert.match(utils, /const \{ analyticsMode, trendRows, summary, focusMetric, generatedAt \} = input;/);
  assert.match(utils, /toCsvRow\(\["snapshot", "focusMetric", focusMetric\]\)/);
  assert.match(utils, /key: "pendingApprovals"/);
  assert.match(utils, /key: "stalledApprovals"/);

  assert.ok(
    countLines(dashboard) <= 300,
    `AdminKpiDashboard.tsx should stay <= 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `AdminKpiSections.tsx should stay <= 300 lines (current: ${countLines(sections)})`
  );

  assert.match(workItem, /WI-0532/i);
  assert.match(workItem, /analytics|focus metric|csv|alignment|filter/i);
  assert.match(roadmap, /WI-0532/i);
}

run()
  .then(() => {
    console.log("e2e-wi0532-admin-analytics-focus-metric-filter-and-csv-alignment.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
