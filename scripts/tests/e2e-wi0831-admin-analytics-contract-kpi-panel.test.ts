import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminContractKpiPanel.tsx");
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0831-admin-analytics-contract-kpi-panel.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /export function buildContractKpiSnapshot/);
  assert.match(panel, /copy\.contractPanel\.title/);
  assert.match(panel, /copy\.contractPanel\.decisionQueueCount/);
  assert.match(panel, /copy\.contractPanel\.pendingResponseCount/);
  assert.match(panel, /copy\.contractPanel\.slaOverdueCount/);
  assert.match(panel, /copy\.contractPanel\.renewalCandidateCount/);

  assert.match(dashboard, /AdminContractKpiPanel/);
  assert.match(dashboard, /buildContractKpiSnapshot/);
  assert.match(dashboard, /contractPendingResponseCount/);
  assert.match(dashboard, /contractRenewalCandidateCount/);
  assert.match(dashboard, /analyticsMode && contractKpi/);

  assert.match(sections, /contractPendingResponseCount: number;/);
  assert.match(sections, /contractRenewalCandidateCount: number;/);

  assert.match(copy, /contractPanel: \{/);
  assert.match(copy, /decisionQueueCount:/);
  assert.match(copy, /pendingResponseCount:/);
  assert.match(copy, /slaOverdueCount:/);
  assert.match(copy, /renewalCandidateCount:/);

  const { buildContractKpiSnapshot } = await import(
    "../../src/components/admin-kpi/AdminContractKpiPanel.tsx"
  );
  const snapshot = buildContractKpiSnapshot({
    decisionQueueCount: 4,
    pendingResponseCount: 2,
    slaOverdueCount: -1,
    renewalCandidateCount: 3
  });
  assert.equal(snapshot.decisionQueueCount, 4);
  assert.equal(snapshot.pendingResponseCount, 2);
  assert.equal(snapshot.slaOverdueCount, 0);
  assert.equal(snapshot.renewalCandidateCount, 3);

  assert.match(workItem, /WI-0831/i);
  assert.match(workItem, /admin|analytics|contract|kpi|panel/i);
  assert.match(roadmap, /WI-0831/i);
}

run()
  .then(() => {
    console.log("e2e-wi0831-admin-analytics-contract-kpi-panel.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
