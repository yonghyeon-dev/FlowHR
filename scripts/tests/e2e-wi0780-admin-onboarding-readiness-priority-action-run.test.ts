import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0780-admin-onboarding-readiness-priority-action-run.md");
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const panelSource = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingReadinessPanel.tsx"
  );

  assert.match(roadmap, /WI-0780/);
  assert.match(workItem, /Admin Onboarding Readiness Priority Action Run/i);

  assert.match(dashboardSource, /const runPriorityAction = async/);
  assert.match(dashboardSource, /key === "departments"/);
  assert.match(dashboardSource, /key === "employees"/);
  assert.match(dashboardSource, /key === "invites"/);
  assert.match(dashboardSource, /key === "leave_policy"/);
  assert.match(dashboardSource, /key === "contracts"/);
  assert.match(dashboardSource, /bootstrapEmploymentContractTemplate/);
  assert.match(dashboardSource, /createPendingContractDrafts/);
  assert.match(dashboardSource, /requestPendingContractApprovals/);
  assert.match(dashboardSource, /approvePendingContractApprovals/);
  assert.match(dashboardSource, /sendPendingContracts/);
  assert.match(dashboardSource, /status=SENT&focus=pending-response/);
  assert.match(dashboardSource, /onRunPriorityAction/);

  assert.match(panelSource, /priorityActionPending/);
  assert.match(panelSource, /onRunPriorityAction/);
  assert.match(panelSource, /priorityItem\.key === "organization"/);
  assert.match(panelSource, /btn btn-secondary btn-small/);
}

run()
  .then(() => {
    console.log("e2e-wi0780-admin-onboarding-readiness-priority-action-run.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
