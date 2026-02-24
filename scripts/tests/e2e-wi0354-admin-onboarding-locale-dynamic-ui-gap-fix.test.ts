import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const dashboard = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const copy = readUtf8("src", "components", "admin-onboarding", "copy.ts");
  const dataHook = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const workItem = readUtf8("work-items", "WI-0354-admin-onboarding-locale-dynamic-ui-gap-fix.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copy, /heroEyebrow/);
  assert.match(copy, /leavePolicyFields/);
  assert.match(copy, /requestLabels/);
  assert.match(copy, /organizationIdLabel: "조직 ID"/);
  assert.match(copy, /doneLabel: "완료"/);
  assert.match(copy, /okLabel: "성공"/);

  assert.match(dashboard, /requestLabels: copy\.requestLabels/);
  assert.match(dashboard, /copy\.heroEyebrow/);

  assert.match(sections, /copy\.leavePolicyFields\.annualGrantDays/);
  assert.match(sections, /copy\.progressLabel/);
  assert.match(sections, /copy\.doneLabel/);
  assert.match(sections, /copy\.okLabel/);
  assert.doesNotMatch(sections, /item\.done \? "DONE" : "TODO"/);

  assert.match(dataHook, /input\.requestLabels\.organizations/);
  assert.match(dataHook, /input\.requestLabels\.createDepartmentPrefix/);
  assert.match(dataHook, /input\.requestLabels\.upsertLeavePolicy/);

  assert.match(workItem, /WI-0354/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0354/i);
}

run()
  .then(() => {
    console.log("e2e-wi0354-admin-onboarding-locale-dynamic-ui-gap-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
