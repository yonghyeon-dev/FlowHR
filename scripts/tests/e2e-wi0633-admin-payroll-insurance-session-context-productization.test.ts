import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8("src", "components", "payroll-insurance", "PayrollInsuranceSettlementConsole.tsx");
  const inputPanelSource = readUtf8("src", "components", "payroll-insurance", "PayrollInsuranceSettlementInputPanel.tsx");
  const workItem = readUtf8("work-items", "WI-0633-admin-payroll-insurance-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(consoleSource, /useStickyStringState/);
  assert.doesNotMatch(consoleSource, /const \[accessToken/);
  assert.match(consoleSource, /const organizationId = \(supabaseSession\?\.organizationId \?\? ""\)\.trim\(\)/);
  assert.match(consoleSource, /const adminActorId = \(supabaseSession\?\.actorId \?\? "PAY-1001"\)\.trim\(\) \|\| "PAY-1001"/);
  assert.match(consoleSource, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(consoleSource, /\{showDevTools \? \(/);
  assert.doesNotMatch(consoleSource, /accessToken=\{accessToken\}/);
  assert.doesNotMatch(consoleSource, /setAccessToken=\{setAccessToken\}/);

  assert.match(inputPanelSource, /sessionOrganizationId: string;/);
  assert.match(inputPanelSource, /sessionAdminActorId: string;/);
  assert.match(inputPanelSource, /canRunPreview: boolean;/);
  assert.match(inputPanelSource, /disabled=\{!canRunPreview \|\| pendingLabel !== null\}/);
  assert.doesNotMatch(inputPanelSource, /accessToken: string;/);
  assert.doesNotMatch(inputPanelSource, /setAccessToken/);
  assert.doesNotMatch(inputPanelSource, /organizationId: string;/);
  assert.doesNotMatch(inputPanelSource, /setOrganizationId/);

  assert.match(workItem, /WI-0633/i);
  assert.match(roadmap, /WI-0633/i);
}

run()
  .then(() => {
    console.log("e2e-wi0633-admin-payroll-insurance-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
