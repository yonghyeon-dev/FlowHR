import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "admin", "approval-templates", "page.tsx");
  const sections = readUtf8("src", "app", "admin", "approval-templates", "page-sections.tsx");
  const workItem = readUtf8("work-items", "WI-0646-admin-approval-templates-product-ux.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(page, /Work conditions/);
  assert.match(page, /Advanced options/);
  assert.match(page, /showDevTools \? \([\s\S]*ApprovalTemplateLogsPanel[\s\S]*\) : \([\s\S]*Related workspaces/);
  assert.match(page, /\/admin\/approval-executions/);
  assert.match(page, /\/admin\/approval-policy/);
  assert.match(page, /\/admin/);

  assert.match(sections, /{log\.label} \/{" "}/);
  assert.match(sections, /{log\.status} \/ {log\.at}/);

  assert.match(workItem, /WI-0646/i);
  assert.match(workItem, /approval-templates|product ux|advanced options|devtools/i);
  assert.match(roadmap, /WI-0646/i);
}

run()
  .then(() => {
    console.log("e2e-wi0646-admin-approval-templates-product-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
