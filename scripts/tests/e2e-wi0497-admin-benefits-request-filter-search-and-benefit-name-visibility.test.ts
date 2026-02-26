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
  const workspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0497-admin-benefits-request-filter-search-and-benefit-name-visibility.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `AdminBenefitsWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );
  assert.match(workspace, /requestFilter/);
  assert.match(workspace, /requestSearchQuery/);
  assert.match(workspace, /visibleRequests/);
  assert.match(workspace, /catalogNameById/);
  assert.match(workspace, /haystack\.includes\(query\)/);

  assert.match(view, /copy\.requestFilterLabel/);
  assert.match(view, /copy\.requestSearchLabel/);
  assert.match(view, /copy\.filteredRequestSummaryLabel/);
  assert.match(view, /copy\.benefitLabel/);
  assert.match(view, /copy\.unknownBenefitLabel/);

  assert.match(copy, /requestFilterLabel/);
  assert.match(copy, /requestSearchLabel/);
  assert.match(copy, /filteredRequestSummaryLabel/);
  assert.match(copy, /filteredEmptyRequests/);
  assert.match(copy, /unknownBenefitLabel/);
  assert.match(copy, /requestFilter: \{/);

  assert.match(workItem, /WI-0497/i);
  assert.match(workItem, /benefits|request|filter|search|visibility/i);
  assert.match(roadmap, /WI-0497/i);
}

run()
  .then(() => {
    console.log("e2e-wi0497-admin-benefits-request-filter-search-and-benefit-name-visibility.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
