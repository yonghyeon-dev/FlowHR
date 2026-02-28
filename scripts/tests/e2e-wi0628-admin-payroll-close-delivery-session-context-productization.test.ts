import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const closeConsole = readUtf8("src", "components", "payroll-close", "PayrollClosePeriodConsole.tsx");
  const closeCopy = readUtf8("src", "components", "payroll-close", "copy.ts");
  const deliveryConsole = readUtf8("src", "components", "payroll-payslip-delivery", "PayrollPayslipDeliveryConsole.tsx");
  const deliveryCopy = readUtf8("src", "components", "payroll-payslip-delivery", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0628-admin-payroll-close-delivery-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(closeConsole, /useStickyStringState/);
  assert.doesNotMatch(closeConsole, /const \[accessToken/);
  assert.match(closeConsole, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(closeConsole, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(closeConsole, /\{showDevTools \? \(/);
  assert.doesNotMatch(closeConsole, /copy\.accessTokenLabel/);
  assert.doesNotMatch(closeConsole, /copy\.organizationIdFallbackLabel/);
  assert.doesNotMatch(closeConsole, /copy\.actorIdFallbackLabel/);

  assert.doesNotMatch(deliveryConsole, /useStickyStringState/);
  assert.doesNotMatch(deliveryConsole, /const \[accessToken/);
  assert.match(deliveryConsole, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(deliveryConsole, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\)/);
  assert.match(deliveryConsole, /\{showDevTools \? \(/);
  assert.doesNotMatch(deliveryConsole, /copy\.accessTokenLabel/);
  assert.doesNotMatch(deliveryConsole, /copy\.organizationIdFallbackLabel/);
  assert.doesNotMatch(deliveryConsole, /copy\.actorIdFallbackLabel/);

  assert.match(closeCopy, /sessionOrganizationLabel/);
  assert.match(closeCopy, /sessionActorLabel/);
  assert.match(deliveryCopy, /sessionOrganizationLabel/);
  assert.match(deliveryCopy, /sessionActorLabel/);

  assert.match(workItem, /WI-0628/i);
  assert.match(roadmap, /WI-0628/i);
}

run()
  .then(() => {
    console.log("e2e-wi0628-admin-payroll-close-delivery-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
