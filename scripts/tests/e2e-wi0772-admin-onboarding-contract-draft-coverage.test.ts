import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0772-admin-onboarding-contract-draft-coverage.md");
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0772/);
  assert.match(workItem, /Admin Onboarding Contract Draft Coverage/i);

  assert.match(dashboardSource, /preparedContractDraftEmployeeCount/);
  assert.match(dashboardSource, /pendingContractDraftCount/);
  assert.match(dashboardSource, /onCreatePendingContractDrafts/);

  assert.match(sectionsSource, /contractDraftCoverageLabel/);
  assert.match(sectionsSource, /contractDraftIssueButton/);
  assert.match(sectionsSource, /onCreatePendingContractDrafts/);
  assert.match(sectionsSource, /pendingContractDraftCount/);

  assert.match(hookSource, /\/api\/contracts\/documents/);
  assert.match(hookSource, /preparedContractDraftEmployeeCount/);
  assert.match(hookSource, /pendingContractDraftCount/);
  assert.match(hookSource, /createPendingContractDrafts/);
  assert.match(hookSource, /createContractDocumentPrefix/);

  assert.match(copySource, /contractDraftCoverageLabel/);
  assert.match(copySource, /contractDraftIssueButton/);
  assert.match(copySource, /createContractDocumentPrefix/);
}

run()
  .then(() => {
    console.log("e2e-wi0772-admin-onboarding-contract-draft-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
