import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminContractKpiPanel.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0832-admin-analytics-contract-priority-action-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /import Link from "next\/link"/);
  assert.match(panel, /resolveContractPriorityAction/);
  assert.match(panel, /snapshot\.slaOverdueCount > 0/);
  assert.match(panel, /snapshot\.pendingResponseCount > 0/);
  assert.match(panel, /snapshot\.decisionQueueCount > 0/);
  assert.match(panel, /snapshot\.renewalCandidateCount > 0/);
  assert.match(panel, /\/admin\/contracts\?slaRisk=OVERDUE/);
  assert.match(panel, /\/admin\/contracts\?status=SENT/);
  assert.match(panel, /\/admin\/contracts\?decisionQueueOnly=true/);
  assert.match(panel, /\/admin\/contracts\?renewalCandidateOnly=true/);
  assert.match(panel, /copy\.contractPanel\.priorityActionLabel/);
  assert.match(panel, /copy\.contractPanel\.quickActionsLabel/);
  assert.match(panel, /copy\.contractPanel\.actionOpenContractsWorkspace/);
  assert.match(panel, /copy\.contractPanel\.actionOpenDecisionQueue/);
  assert.match(panel, /copy\.contractPanel\.actionOpenPendingResponseQueue/);
  assert.match(panel, /copy\.contractPanel\.actionOpenSlaOverdueQueue/);

  assert.match(copy, /contractPanel: \{/);
  assert.match(copy, /priorityActionLabel:/);
  assert.match(copy, /quickActionsLabel:/);
  assert.match(copy, /actionOpenContractsWorkspace:/);
  assert.match(copy, /actionOpenDecisionQueue:/);
  assert.match(copy, /actionOpenPendingResponseQueue:/);
  assert.match(copy, /actionOpenSlaOverdueQueue:/);
  assert.match(copy, /priorityReasonSlaOverdue:/);
  assert.match(copy, /priorityReasonPendingResponse:/);
  assert.match(copy, /priorityReasonDecisionQueue:/);
  assert.match(copy, /priorityReasonRenewal:/);
  assert.match(copy, /priorityReasonClear:/);

  const { buildContractKpiSnapshot } = await import(
    "../../src/components/admin-kpi/AdminContractKpiPanel.tsx"
  );
  const snapshot = buildContractKpiSnapshot({
    decisionQueueCount: 2,
    pendingResponseCount: 1,
    slaOverdueCount: 0,
    renewalCandidateCount: 3
  });
  assert.equal(snapshot.decisionQueueCount, 2);
  assert.equal(snapshot.pendingResponseCount, 1);
  assert.equal(snapshot.slaOverdueCount, 0);
  assert.equal(snapshot.renewalCandidateCount, 3);

  assert.match(workItem, /WI-0832/i);
  assert.match(workItem, /admin|analytics|contract|priority|action|link/i);
  assert.match(roadmap, /WI-0832/i);
}

run()
  .then(() => {
    console.log("e2e-wi0832-admin-analytics-contract-priority-action-links.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
