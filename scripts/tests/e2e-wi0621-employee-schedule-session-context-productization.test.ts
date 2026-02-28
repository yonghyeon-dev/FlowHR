import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const board = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
  const view = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoardView.tsx");
  const copy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0621-employee-schedule-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(board, /useStickyStringState/);
  assert.doesNotMatch(board, /const \[accessToken/);
  assert.match(board, /const organizationId = \(supabaseSession\?\.organizationId/);
  assert.match(board, /showDevTools={showDevTools}/);

  assert.doesNotMatch(view, /onOrganizationIdChange/);
  assert.doesNotMatch(view, /onEmployeeIdChange/);
  assert.doesNotMatch(view, /onAccessTokenChange/);
  assert.doesNotMatch(view, /copy\.accessTokenLabel/);
  assert.match(view, /sessionOrganizationId/);
  assert.match(view, /\{showDevTools \? \(/);

  assert.match(copy, /sessionOrganizationId|세션 조직|Session organization/);
  assert.match(workItem, /WI-0621/i);
  assert.match(roadmap, /WI-0621/i);
}

run()
  .then(() => {
    console.log("e2e-wi0621-employee-schedule-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
