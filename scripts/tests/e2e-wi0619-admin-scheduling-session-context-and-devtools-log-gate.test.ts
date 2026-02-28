import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workspace = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspace.tsx");
  const view = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspaceView.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0619-admin-scheduling-session-context-and-devtools-log-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(workspace, /useStickyStringState/);
  assert.doesNotMatch(workspace, /const \[accessToken/);
  assert.match(workspace, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(workspace, /showDevTools={showDevTools}/);

  assert.doesNotMatch(view, /onOrganizationIdChange/);
  assert.doesNotMatch(view, /onAdminActorIdChange/);
  assert.doesNotMatch(view, /onAccessTokenChange/);
  assert.doesNotMatch(view, /copy\.accessTokenLabel/);
  assert.match(view, /\{showDevTools \? \(/);
  assert.match(view, /Session organization|세션 조직|copy\.organizationIdLabel/);

  assert.match(workItem, /WI-0619/i);
  assert.match(workItem, /scheduling|session|devtools|log/i);
  assert.match(roadmap, /WI-0619/i);
}

run()
  .then(() => {
    console.log("e2e-wi0619-admin-scheduling-session-context-and-devtools-log-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
