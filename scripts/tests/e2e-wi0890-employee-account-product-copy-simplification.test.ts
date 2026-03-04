import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const accountOverviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0890-employee-account-product-copy-simplification.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.doesNotMatch(accountOverviewPanels, /role=\$\{supabaseSession\.role/);
  assert.doesNotMatch(accountOverviewPanels, /org=\$\{supabaseSession\.organizationId/);
  assert.match(accountOverviewPanels, /Signed in as/);
  assert.match(accountOverviewPanels, /href="\/login"/);
  assert.match(accountOverviewPanels, /showDevTools \? \(/);
  assert.match(accountOverviewPanels, /Auth mode/);

  assert.match(workItem, /WI-0890/i);
  assert.match(roadmap, /WI-0890/i);
}

run()
  .then(() => {
    console.log("e2e-wi0890-employee-account-product-copy-simplification.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

