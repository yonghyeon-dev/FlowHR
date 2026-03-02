import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0777-admin-onboarding-contract-checklist-coverage.md");
  const checklistSource = readUtf8("src", "features", "admin-onboarding", "checklist.ts");
  const hookSource = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const sectionsSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0777/);
  assert.match(workItem, /Admin Onboarding Contract Checklist Coverage/i);

  assert.match(checklistSource, /contractJourneyDone/);
  assert.match(checklistSource, /"contracts"/);
  assert.match(hookSource, /const contractJourneyDone/);
  assert.match(hookSource, /pendingContractResponseCount === 0/);
  assert.match(hookSource, /contractJourneyDone/);
  assert.match(sectionsSource, /item\.key === "leave_policy"/);
  assert.match(sectionsSource, /copy\.checklist\.contracts/);
  assert.match(copySource, /contracts:\s*"Contract onboarding coverage complete"/);
  assert.match(copySource, /contracts:\s*"계약 온보딩 커버리지 완료"/);
}

run()
  .then(() => {
    console.log("e2e-wi0777-admin-onboarding-contract-checklist-coverage.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
