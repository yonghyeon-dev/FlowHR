import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0773-admin-onboarding-contract-approval-request-coverage.md");
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0773/);
  assert.match(workItem, /Admin Onboarding Contract Approval Request Coverage/i);

  assert.match(dashboardSource, /approvalRequestedContractEmployeeCount/);
  assert.match(dashboardSource, /pendingContractApprovalRequestCount/);
  assert.match(dashboardSource, /onRequestPendingContractApprovals/);

  assert.match(sectionsSource, /contractApprovalCoverageLabel/);
  assert.match(sectionsSource, /contractApprovalIssueButton/);
  assert.match(sectionsSource, /pendingContractApprovalRequestCount/);
  assert.match(sectionsSource, /onRequestPendingContractApprovals/);

  assert.match(hookSource, /requestPendingContractApprovals/);
  assert.match(hookSource, /requestContractApprovalPrefix/);
  assert.match(hookSource, /\/request-approval/);
  assert.match(hookSource, /pendingContractApprovalRequestDocumentIds/);

  assert.match(copySource, /contractApprovalCoverageLabel/);
  assert.match(copySource, /contractApprovalIssueButton/);
  assert.match(copySource, /requestContractApprovalPrefix/);
}

run()
  .then(() => {
    console.log("e2e-wi0773-admin-onboarding-contract-approval-request-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
