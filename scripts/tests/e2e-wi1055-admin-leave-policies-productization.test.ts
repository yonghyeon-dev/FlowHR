import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const pagePath = join(process.cwd(), "src", "app", "admin", "leave-policies", "page.tsx");

  assert.ok(existsSync(pagePath), "admin leave policies page must exist");

  const page = readUtf8("src", "app", "admin", "leave-policies", "page.tsx");

  assert.match(adminLayout, /href: "\/admin\/leave-policies"/, "admin nav should expose the leave policies page");
  assert.match(
    workspaceHubs,
    /href: "\/admin\/leave-policies"/,
    "admin workspace hubs should expose the leave policies page"
  );
  assert.match(page, /path: "\/api\/leave\/policy"/, "leave policies page should load and save current policy");
  assert.match(page, /path: `\/api\/leave\/policies\?status=\$\{encodeURIComponent\(statusFilter\)\}`/, "leave policies page should list policies");
  assert.match(page, /path: `\/api\/leave\/policies\/\$\{encodeURIComponent\(policy\.id\)\}`/, "leave policies page should archive policies");
  assert.match(page, /pageTitle: "휴가 정책 관리"|pageTitle: "Leave Policy Management"/);
  assert.match(workItem, /Leave-policy management product surface/i);
  assert.match(progress, /WI-1055/i);
}

run()
  .then(() => {
    console.log("e2e-wi1055-admin-leave-policies-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
