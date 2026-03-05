import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0975-contracts-bearer-token.md");
  const workspaceActions = readUtf8(
    "src",
    "components",
    "contracts",
    "useAdminContractsWorkspaceActions.ts"
  );
  const templateBuilder = readUtf8(
    "src",
    "components",
    "contracts",
    "ContractTemplateBuilder.tsx"
  );
  const employeeInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");

  assert.match(wi, /WI-0975/);
  assert.match(wi, /Authorization:\s*Bearer/i);
  assert.match(wi, /useSupabaseSession/);

  const sources = [workspaceActions, templateBuilder, employeeInbox];
  for (const source of sources) {
    assert.match(source, /useSupabaseSession/);
    assert.match(source, /snapshot\?\.accessToken\?\.trim\(\)\s*\?\?\s*""/);
    assert.match(source, /authorization:\s*`Bearer \$\{accessToken\}`/);
  }

  assert.match(workspaceActions, /fetch\("\/api\/contracts\/templates",[\s\S]*headers:\s*authorizationHeader/);
  assert.match(workspaceActions, /fetch\("\/api\/contracts\/documents",[\s\S]*headers:\s*authorizationHeader/);
  assert.match(templateBuilder, /fetch\("\/api\/contracts\/templates", \{/);
  assert.match(employeeInbox, /fetch\("\/api\/contracts\/documents", \{/);
  assert.match(employeeInbox, /\/signature-evidence\?format=\$\{format\}/);
}

run();
console.log("e2e-wi0975-contracts-bearer-token.test passed");
