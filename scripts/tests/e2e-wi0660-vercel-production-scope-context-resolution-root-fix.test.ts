import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const workflow = readUtf8(".github", "workflows", "vercel-production-deploy.yml");
  const wi = readUtf8(
    "work-items",
    "WI-0660-vercel-production-scope-context-resolution-root-fix.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(workflow, /scope_candidates=\("__UNSCOPED__"\)/);
  assert.match(workflow, /scope_candidates\+=\("\$VERCEL_SCOPE"\)/);
  assert.match(workflow, /scope_candidates\+=\("\$GITHUB_REPOSITORY_OWNER"\)/);
  assert.match(workflow, /context_label="unscoped"/);
  assert.match(workflow, /scope-not-accessible\|do not have access to the specified account/);
  assert.match(workflow, /All vercel .* attempts failed with context-access errors/);
  assert.match(workflow, /npx vercel@latest whoami --token "\$VERCEL_TOKEN"/);

  assert.match(wi, /WI-0660/i);
  assert.match(wi, /vercel|production|scope|context|resolution|root fix/i);
  assert.match(roadmap, /WI-0660/i);
}

run()
  .then(() => {
    console.log("e2e-wi0660-vercel-production-scope-context-resolution-root-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
