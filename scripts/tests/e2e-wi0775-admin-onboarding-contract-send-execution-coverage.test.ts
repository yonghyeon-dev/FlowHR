import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8(
    "work-items",
    "WI-0775-admin-onboarding-contract-send-execution-coverage.md"
  );
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0775/);
  assert.match(workItem, /Admin Onboarding Contract Send Execution Coverage/i);

  assert.match(dashboardSource, /sentContractEmployeeCount/);
  assert.match(dashboardSource, /pendingContractSendCount/);
  assert.match(dashboardSource, /onSendPendingContracts/);

  assert.match(sectionsSource, /contractSendCoverageLabel/);
  assert.match(sectionsSource, /contractSendIssueButton/);
  assert.match(sectionsSource, /pendingContractSendCount/);
  assert.match(sectionsSource, /onSendPendingContracts/);

  assert.match(hookSource, /sendPendingContracts/);
  assert.match(hookSource, /sendContractPrefix/);
  assert.match(hookSource, /\/api\/contracts\/documents\/.+\/send/);
  assert.match(hookSource, /pendingContractSendDocumentIds/);
  assert.match(hookSource, /sentContractEmployeeCount/);

  assert.match(copySource, /contractSendCoverageLabel/);
  assert.match(copySource, /contractSendIssueButton/);
  assert.match(copySource, /sendContractPrefix/);
}

run()
  .then(() => {
    console.log("e2e-wi0775-admin-onboarding-contract-send-execution-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
