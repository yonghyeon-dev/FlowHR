import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const executions = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const executionSections = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page-sections-work-conditions.tsx"
  );
  const history = readUtf8("src", "app", "admin", "approval-history", "page.tsx");
  const policy = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const templates = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0626-admin-approval-pages-session-context-productization.md");
  const roadmap = readUtf8("ROADMAP.md");

  for (const source of [executions, history, policy, templates]) {
    assert.doesNotMatch(source, /useStickyStringState/);
    assert.doesNotMatch(source, /const \[accessToken/);
    assert.doesNotMatch(source, /setOrganizationId/);
    assert.doesNotMatch(source, /setAdminActorId/);
    assert.doesNotMatch(source, /setAccessToken/);
    assert.match(source, /const organizationId = \(supabaseSession\?\.organizationId/);
  }

  assert.match(history, /filters\.organizationId[\s\S]*filters\.adminActorId/);
  assert.match(policy, /context\.organizationId[\s\S]*context\.adminActorId/);
  assert.match(templates, /context\.organizationId[\s\S]*context\.adminActorId/);
  assert.match(executionSections, /Work conditions[\s\S]*Session actor/);

  assert.match(workItem, /WI-0626/i);
  assert.match(roadmap, /WI-0626/i);
}

run()
  .then(() => {
    console.log("e2e-wi0626-admin-approval-pages-session-context-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
