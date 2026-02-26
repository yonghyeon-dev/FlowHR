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
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const utils = readUtf8("src", "components", "admin-kpi", "dashboard-utils.ts");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const summary = readUtf8("src", "features", "admin-kpi", "summary.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0543-admin-analytics-contract-sla-overdue-metric.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(summary, /contractSlaOverdueCount: number;/);
  assert.match(summary, /contractSlaOverdueCount: Math\.max\(0, Math\.trunc\(input\.contractSlaOverdueCount\)\)/);

  assert.match(dashboard, /type ContractDocumentLite = \{/);
  assert.match(dashboard, /requestJson\("contract documents"/);
  assert.match(dashboard, /const contractSlaOverdueCount = contractDocuments\.filter/);
  assert.match(dashboard, /contractSlaTrackedStatuses/);
  assert.match(dashboard, /contractSlaOverdueCount/);

  assert.match(sections, /"contractSlaOverdueCount"/);
  assert.match(sections, /option value="contractSlaOverdueCount"/);
  assert.match(sections, /copy\.cards\.contractSlaOverdueCount/);
  assert.match(sections, /kpi\.summary\.contractSlaOverdueCount/);

  assert.match(utils, /key: "contractSlaOverdueCount"/);
  assert.match(utils, /summary\.contractSlaOverdueCount/);

  assert.match(copy, /contractSlaOverdueCount:/);

  assert.ok(
    countLines(dashboard) <= 300,
    `AdminKpiDashboard.tsx should stay <= 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `AdminKpiSections.tsx should stay <= 300 lines (current: ${countLines(sections)})`
  );

  assert.match(workItem, /WI-0543/i);
  assert.match(workItem, /analytics|contracts|sla|overdue|metric/i);
  assert.match(roadmap, /WI-0543/i);
}

run()
  .then(() => {
    console.log("e2e-wi0543-admin-analytics-contract-sla-overdue-metric.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

