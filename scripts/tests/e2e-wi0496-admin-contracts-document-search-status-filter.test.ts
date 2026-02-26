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
  const workspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const controls = readUtf8("src", "components", "contracts", "AdminContractsDocumentFilterControls.tsx");
  const filtersHook = readUtf8("src", "components", "contracts", "useAdminContractsDocumentFilters.ts");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0496-admin-contracts-document-search-status-filter-core-journey.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /useAdminContractsDocumentFilters/);
  assert.match(workspace, /AdminContractsDocumentFilterControls/);
  assert.match(workspace, /visibleDocuments\.map/);

  assert.match(controls, /copy\.documentSearchLabel/);
  assert.match(controls, /copy\.documentStatusFilterLabel/);
  assert.match(controls, /copy\.allDocumentStatusOption/);
  assert.match(controls, /copy\.documentVisibleCountLabel/);

  assert.match(filtersHook, /documentStatusFilter !== "ALL"/);
  assert.match(filtersHook, /formatEmployeeIdForLocaleDisplay/);
  assert.match(filtersHook, /haystack\.includes\(query\)/);

  assert.match(copy, /documentSearchLabel/);
  assert.match(copy, /documentStatusFilterLabel/);
  assert.match(copy, /allDocumentStatusOption/);
  assert.match(copy, /documentVisibleCountLabel/);

  assert.match(workItem, /WI-0496/i);
  assert.match(workItem, /contracts|search|filter|status/i);
  assert.match(roadmap, /WI-0496/i);
}

run()
  .then(() => {
    console.log("e2e-wi0496-admin-contracts-document-search-status-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
