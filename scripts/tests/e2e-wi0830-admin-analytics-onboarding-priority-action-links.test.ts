import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8("src", "components", "admin-kpi", "AdminOnboardingKpiPanel.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0830-admin-analytics-onboarding-priority-action-links.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /import Link from "next\/link"/);
  assert.match(panel, /resolveOnboardingPriorityAction/);
  assert.match(panel, /snapshot\.pendingContractResponseCount > 0/);
  assert.match(panel, /snapshot\.pendingInviteCount > 0/);
  assert.match(panel, /snapshot\.readinessPercent < 100/);
  assert.match(panel, /\/admin\/contracts\?status=SENT&focus=pending-response/);
  assert.match(panel, /copy\.onboardingPanel\.priorityActionLabel/);
  assert.match(panel, /copy\.onboardingPanel\.quickActionsLabel/);
  assert.match(panel, /copy\.onboardingPanel\.actionOpenOnboardingWorkspace/);
  assert.match(panel, /copy\.onboardingPanel\.actionOpenPendingContractResponses/);
  assert.match(panel, /copy\.onboardingPanel\.actionOpenPeopleWorkspace/);

  assert.match(copy, /onboardingPanel: \{/);
  assert.match(copy, /priorityActionLabel:/);
  assert.match(copy, /quickActionsLabel:/);
  assert.match(copy, /actionOpenOnboardingWorkspace:/);
  assert.match(copy, /actionOpenPendingContractResponses:/);
  assert.match(copy, /actionOpenPeopleWorkspace:/);
  assert.match(copy, /priorityReasonContractResponses:/);
  assert.match(copy, /priorityReasonInvites:/);
  assert.match(copy, /priorityReasonReadiness:/);
  assert.match(copy, /priorityReasonClear:/);

  const { buildOnboardingKpiSnapshot } = await import(
    "../../src/components/admin-kpi/AdminOnboardingKpiPanel.tsx"
  );
  const snapshot = buildOnboardingKpiSnapshot({
    employees: [
      { id: "EMP-1", email: "a@company.com" },
      { id: "EMP-2", email: "b@company.com" }
    ],
    invites: [{ email: "a@company.com" }],
    contractDocuments: [{ employeeId: "EMP-1", status: "SENT" }]
  });
  assert.equal(snapshot.activeEmployeeCount, 2);
  assert.equal(snapshot.pendingInviteCount, 1);
  assert.equal(snapshot.pendingContractResponseCount, 1);

  assert.match(workItem, /WI-0830/i);
  assert.match(workItem, /admin|analytics|onboarding|priority|action|link/i);
  assert.match(roadmap, /WI-0830/i);
}

run()
  .then(() => {
    console.log("e2e-wi0830-admin-analytics-onboarding-priority-action-links.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
