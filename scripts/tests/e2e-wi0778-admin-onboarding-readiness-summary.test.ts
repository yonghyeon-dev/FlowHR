import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0778-admin-onboarding-readiness-summary.md");
  const dashboardSource = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const panelSource = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingReadinessPanel.tsx"
  );
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0778/);
  assert.match(workItem, /Admin Onboarding Readiness Summary/i);

  assert.match(dashboardSource, /AdminOnboardingReadinessPanel/);
  assert.match(panelSource, /readinessTitle/);
  assert.match(panelSource, /readinessReadyLabel/);
  assert.match(panelSource, /readinessPendingLabel/);
  assert.match(panelSource, /checklistHrefByKey/);
  assert.match(panelSource, /\/admin\/contracts/);

  assert.match(copySource, /readinessTitle/);
  assert.match(copySource, /readinessOpenWorkspaceLabel/);
}

run()
  .then(() => {
    console.log("e2e-wi0778-admin-onboarding-readiness-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
