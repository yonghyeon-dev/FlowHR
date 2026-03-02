import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0774-admin-onboarding-contract-send-coverage.md");
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0774/);
  assert.match(workItem, /Admin Onboarding Contract Approval Decision Coverage/i);

  assert.match(dashboardSource, /approvedContractEmployeeCount/);
  assert.match(dashboardSource, /pendingContractApprovalDecisionCount/);
  assert.match(dashboardSource, /onApprovePendingContractApprovals/);

  assert.match(sectionsSource, /contractApprovalDecisionCoverageLabel/);
  assert.match(sectionsSource, /contractApprovalDecisionIssueButton/);
  assert.match(sectionsSource, /pendingContractApprovalDecisionCount/);
  assert.match(sectionsSource, /onApprovePendingContractApprovals/);

  assert.match(hookSource, /approvePendingContractApprovals/);
  assert.match(hookSource, /approveContractPrefix/);
  assert.match(hookSource, /\/api\/contracts\/documents\/.+\/approval/);
  assert.match(hookSource, /pendingContractApprovalDecisionDocumentIds/);

  assert.match(copySource, /contractApprovalDecisionCoverageLabel/);
  assert.match(copySource, /contractApprovalDecisionIssueButton/);
  assert.match(copySource, /approveContractPrefix/);
}

run()
  .then(() => {
    console.log("e2e-wi0774-admin-onboarding-contract-send-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
