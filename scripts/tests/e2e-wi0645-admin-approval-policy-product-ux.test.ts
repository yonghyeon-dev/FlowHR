import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0645-admin-approval-policy-product-ux.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(page, /Work conditions/);
  assert.match(page, /Advanced options/);
  assert.match(page, /showDevTools \? \([\s\S]*copy\.logs\.title[\s\S]*\) : \([\s\S]*Related workspaces/);
  assert.match(page, /\/admin\/approval-executions/);
  assert.match(page, /\/admin\/approval-history/);

  assert.match(workItem, /WI-0645/i);
  assert.match(workItem, /approval-policy|product ux|advanced options|devtools/i);
  assert.match(roadmap, /WI-0645/i);
}

run()
  .then(() => {
    console.log("e2e-wi0645-admin-approval-policy-product-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
