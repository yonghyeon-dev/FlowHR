import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const page = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const workItem = readUtf8("work-items", "WI-0643-admin-approval-executions-product-ux.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(page, /return "\/admin\/payroll-year-end";/);
  assert.match(page, /return "\/admin\/leave-accrual";/);
  assert.match(page, /return "\/admin\/attendance-live";/);
  assert.doesNotMatch(page, /\/admin#payroll/);
  assert.doesNotMatch(page, /\/admin#approvals/);

  assert.match(page, /Work conditions/);
  assert.match(page, /Advanced options/);
  assert.match(page, /showDevTools \? \([\s\S]*Request logs[\s\S]*\) : \([\s\S]*Related workspaces/);

  assert.match(workItem, /WI-0643/i);
  assert.match(workItem, /approval-executions|product ux|devtools|quick jump/i);
  assert.match(roadmap, /WI-0643/i);
}

run()
  .then(() => {
    console.log("e2e-wi0643-admin-approval-executions-product-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
