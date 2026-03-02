import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0779-admin-onboarding-readiness-priority-action.md");
  const panelSource = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingReadinessPanel.tsx"
  );
  const copySource = readUtf8("src", "components", "admin-onboarding", "copy.ts");

  assert.match(roadmap, /WI-0779/);
  assert.match(workItem, /Admin Onboarding Readiness Priority Action/i);

  assert.match(panelSource, /priorityItem/);
  assert.match(panelSource, /readinessPriorityTitle/);
  assert.match(panelSource, /readinessPriorityHint/);
  assert.match(panelSource, /readinessPriorityActionLabel/);
  assert.match(panelSource, /btn btn-primary btn-small/);

  assert.match(copySource, /readinessPriorityTitle/);
  assert.match(copySource, /readinessPriorityHint/);
  assert.match(copySource, /readinessPriorityActionLabel/);
}

run()
  .then(() => {
    console.log("e2e-wi0779-admin-onboarding-readiness-priority-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
