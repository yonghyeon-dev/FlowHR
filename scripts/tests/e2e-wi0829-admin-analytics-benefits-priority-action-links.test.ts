import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminBenefitsKpiPanel.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0829-admin-analytics-benefits-priority-action-links.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /import Link from "next\/link"/);
  assert.match(panel, /resolveBenefitsPriorityAction/);
  assert.match(panel, /snapshot\.pendingAging3dCount > 0/);
  assert.match(panel, /snapshot\.overLimitSubmittedCount > 0/);
  assert.match(panel, /snapshot\.submittedCount > 0/);
  assert.match(panel, /\/admin\/benefits\?status=SUBMITTED&risk=pending_3d/);
  assert.match(panel, /\/admin\/benefits\?status=SUBMITTED&risk=over_limit/);
  assert.match(panel, /copy\.benefitsPanel\.priorityActionLabel/);
  assert.match(panel, /copy\.benefitsPanel\.quickActionsLabel/);
  assert.match(panel, /copy\.benefitsPanel\.actionOpenBenefitsWorkspace/);
  assert.match(panel, /copy\.benefitsPanel\.actionOpenPendingQueue/);
  assert.match(panel, /copy\.benefitsPanel\.actionOpenOverLimitQueue/);

  assert.match(copy, /benefitsPanel: \{/);
  assert.match(copy, /priorityActionLabel:/);
  assert.match(copy, /quickActionsLabel:/);
  assert.match(copy, /actionOpenBenefitsWorkspace:/);
  assert.match(copy, /actionOpenPendingQueue:/);
  assert.match(copy, /actionOpenOverLimitQueue:/);
  assert.match(copy, /priorityReasonAging:/);
  assert.match(copy, /priorityReasonOverLimit:/);
  assert.match(copy, /priorityReasonSubmitted:/);
  assert.match(copy, /priorityReasonClear:/);

  const { buildBenefitsKpiSnapshot } = await import(
    "../../src/components/admin-kpi/AdminBenefitsKpiPanel.tsx"
  );
  const now = new Date("2026-03-03T00:00:00.000Z");
  const snapshot = buildBenefitsKpiSnapshot(
    {
      catalog: [{ id: "B-1", annualLimitKrw: 100000, status: "ACTIVE" }],
      requests: [
        {
          benefitId: "B-1",
          amountKrw: 110000,
          status: "SUBMITTED",
          requestedAt: "2026-02-20T00:00:00.000Z"
        },
        {
          benefitId: "B-1",
          amountKrw: 50000,
          status: "APPROVED",
          requestedAt: "2026-02-28T00:00:00.000Z"
        }
      ]
    },
    now
  );
  assert.equal(snapshot.submittedCount, 1);
  assert.equal(snapshot.pendingAging3dCount, 1);
  assert.equal(snapshot.overLimitSubmittedCount, 1);

  assert.match(workItem, /WI-0829/i);
  assert.match(workItem, /admin|analytics|benefits|priority|action|link/i);
  assert.match(roadmap, /WI-0829/i);
}

run()
  .then(() => {
    console.log("e2e-wi0829-admin-analytics-benefits-priority-action-links.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
