import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0882-admin-approval-executions-product-mode-gate.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(page, /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/);
  assert.match(page, /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/);
  assert.match(page, /else if \(allowHeaderActorFallback\)/);
  assert.match(page, /Login session is required in production\./);
  assert.match(page, /<Link href="\/login">\/login<\/Link>/);

  assert.match(page, /if \(requiresLoginSession \|\| !organizationId\.trim\(\)\) \{/);
  assert.match(page, /organizationId=\{requiresLoginSession \? "" : organizationId\}/);

  assert.match(page, /showDevTools \? \([\s\S]*ApprovalExecutionLogsPanel[\s\S]*\) : \([\s\S]*ApprovalExecutionRelatedWorkspacesPanel/);

  assert.match(workItem, /WI-0882/i);
  assert.match(workItem, /approval-executions|product-mode|devtools|login session/i);
  assert.match(roadmap, /WI-0882/i);
}

run()
  .then(() => {
    console.log("e2e-wi0882-admin-approval-executions-product-mode-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
