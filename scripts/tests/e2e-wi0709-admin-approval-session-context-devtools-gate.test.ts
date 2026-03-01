import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const approvalPolicyPage = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const approvalHistoryPage = readUtf8("src", "app", "admin", "approval-history", "page.tsx");
  const approvalTemplatesPage = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0709-admin-approval-session-context-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    approvalPolicyPage,
    /showDevTools \? \([\s\S]*copy\.context\.organizationId[\s\S]*copy\.context\.adminActorId/
  );
  assert.match(
    approvalHistoryPage,
    /showDevTools \? \([\s\S]*copy\.filters\.organizationId[\s\S]*copy\.filters\.adminActorId/
  );
  assert.match(
    approvalTemplatesPage,
    /showDevTools \? \([\s\S]*copy\.context\.organizationId[\s\S]*copy\.context\.adminActorId/
  );

  assert.match(workItem, /WI-0709/i);
  assert.match(workItem, /approval|session context|devtools|policy|history|templates/i);
  assert.match(roadmap, /WI-0709/i);
}

run()
  .then(() => {
    console.log("e2e-wi0709-admin-approval-session-context-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
