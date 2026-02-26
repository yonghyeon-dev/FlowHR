import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const adminWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const adminWorkspaceHook = readUtf8(
    "src",
    "components",
    "contracts",
    "useAdminContractsWorkspaceActions.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0495-admin-contracts-workspace-action-hook-extraction-line-budget-margin.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(adminWorkspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.match(adminWorkspace, /useAdminContractsWorkspaceActions/);
  assert.match(adminWorkspace, /id=\"contract-template-library\"/);
  assert.match(adminWorkspace, /id=\"contract-signature-readiness\"/);
  assert.match(adminWorkspace, /aria-label=\{copy\.templateListAria\}/);
  assert.match(adminWorkspace, /aria-label=\{copy\.documentListAria\}/);

  assert.match(adminWorkspaceHook, /resolveContractDocumentActionRequest/);
  assert.match(adminWorkspaceHook, /readJson\(response,\s*copy\.loadError\)/);
  assert.match(adminWorkspaceHook, /readJson\(response,\s*copy\.templateCreateError\)/);
  assert.match(adminWorkspaceHook, /readJson\(response,\s*copy\.draftCreateError\)/);

  assert.match(workItem, /WI-0495/i);
  assert.match(workItem, /contracts|workspace|hook|line budget/i);
  assert.match(roadmap, /WI-0495/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0495-admin-contracts-workspace-action-hook-extraction-line-budget-margin.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
