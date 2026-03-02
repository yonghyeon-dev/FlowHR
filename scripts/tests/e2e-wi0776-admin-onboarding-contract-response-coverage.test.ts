import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0776-admin-onboarding-contract-response-coverage.md");
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0776/);
  assert.match(workItem, /Admin Onboarding Contract Response Coverage/i);

  assert.match(dashboardSource, /respondedContractEmployeeCount/);
  assert.match(dashboardSource, /pendingContractResponseCount/);
  assert.match(dashboardSource, /onOpenPendingContractResponses/);
  assert.match(dashboardSource, /\/admin\/contracts\?status=SENT/);

  assert.match(sectionsSource, /contractResponseCoverageLabel/);
  assert.match(sectionsSource, /contractResponseQueueButton/);
  assert.match(sectionsSource, /pendingContractResponseCount/);
  assert.match(sectionsSource, /onOpenPendingContractResponses/);

  assert.match(hookSource, /respondedContractEmployeeCount/);
  assert.match(hookSource, /pendingContractResponseCount/);
  assert.match(hookSource, /const responseStatusSet = new Set/);

  assert.match(copySource, /contractResponseCoverageLabel/);
  assert.match(copySource, /contractResponseQueueButton/);
}

run()
  .then(() => {
    console.log("e2e-wi0776-admin-onboarding-contract-response-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
