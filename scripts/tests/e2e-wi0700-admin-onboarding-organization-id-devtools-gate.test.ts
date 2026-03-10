import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const onboardingDashboard = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingDashboard.tsx"
  );
  const onboardingSections = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingSections.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0700-admin-onboarding-organization-id-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(onboardingDashboard, /showDevTools=\{data\.showDevTools\}/);

  assert.match(onboardingSections, /showDevTools: boolean;/);
  assert.match(
    onboardingSections,
    /\{showDevTools \? \(\s*<p className="small muted">[\s\S]*\{copy\.organizationIdLabel\}:/
  );
  assert.doesNotMatch(onboardingSections, /organization\.id\}\)`/);
  assert.doesNotMatch(onboardingSections, /\(\$\{organization\.id\}\)/);

  assert.match(workItem, /WI-0700/i);
  assert.match(workItem, /onboarding|organization id|devtools|gate/i);
  assert.match(roadmap, /WI-0700/i);
}

run()
  .then(() => {
    console.log("e2e-wi0700-admin-onboarding-organization-id-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
