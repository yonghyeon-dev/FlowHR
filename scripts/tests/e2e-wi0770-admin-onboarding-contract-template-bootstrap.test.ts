import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const dashboard = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-onboarding", "AdminOnboardingSections.tsx");
  const dataHook = readUtf8("src", "components", "admin-onboarding", "useAdminOnboardingData.ts");
  const copy = readUtf8("src", "components", "admin-onboarding", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0770-admin-onboarding-contract-template-bootstrap.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /activeContractTemplateCount=\{data\.activeContractTemplateCount\}/);
  assert.match(dashboard, /onBootstrapEmploymentContractTemplate=\{\(\) => \{/);
  assert.match(dashboard, /void data\.bootstrapEmploymentContractTemplate\(\)/);

  assert.match(sections, /copy\.contractTemplateTitle/);
  assert.match(sections, /copy\.contractTemplateDescription/);
  assert.match(sections, /copy\.contractTemplateBootstrapButton/);
  assert.match(sections, /activeContractTemplateCount > 0/);
  assert.match(sections, /onBootstrapEmploymentContractTemplate/);

  assert.match(dataHook, /const \[activeContractTemplateCount, setActiveContractTemplateCount\] = useState\(0\)/);
  assert.match(dataHook, /\/api\/contracts\/templates/);
  assert.match(dataHook, /category: "employment"/);
  assert.match(dataHook, /status: "ACTIVE"/);
  assert.match(dataHook, /const bootstrapEmploymentContractTemplate = useCallback/);
  assert.match(dataHook, /name: "Employment Contract Template"/);
  assert.match(dataHook, /input\.requestLabels\.createContractTemplate/);

  assert.match(copy, /contractTemplateTitle/);
  assert.match(copy, /contractTemplateDescription/);
  assert.match(copy, /contractTemplateBootstrapButton/);
  assert.match(copy, /createContractTemplate/);

  assert.ok(
    countLines(sections) <= 300,
    `AdminOnboardingSections.tsx should stay under 300 lines (current: ${countLines(sections)})`
  );

  assert.match(workItem, /WI-0770/i);
  assert.match(workItem, /onboarding|contract|template|bootstrap/i);
  assert.match(roadmap, /WI-0770/i);
}

run()
  .then(() => {
    console.log("e2e-wi0770-admin-onboarding-contract-template-bootstrap.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
