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
  const workspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const view = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspaceView.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0818-benefits-history-name-resolution-with-inactive-catalog.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `EmployeeBenefitsWorkspace.tsx should stay under 300 lines (current: ${countLines(workspace)})`
  );
  assert.ok(
    countLines(view) <= 300,
    `EmployeeBenefitsWorkspaceView.tsx should stay under 300 lines (current: ${countLines(view)})`
  );

  assert.match(workspace, /const catalogQuery = buildBenefitsQuery\(\{ organizationId \}\);/);
  assert.match(
    workspace,
    /const requestableCatalog = useMemo\(\s*\(\) => catalog\.filter\(\(item\) => item\.status === "ACTIVE"\),\s*\[catalog\]\s*\)/
  );
  assert.match(
    workspace,
    /resolveBenefitName=\{\(benefitId\) => catalogById\.get\(benefitId\)\?\.name \?\? copy\.unknownBenefitLabel\}/
  );
  assert.match(view, /requestableCatalog: BenefitCatalogItem\[];/);
  assert.match(view, /\{requestableCatalog\.map\(\(item\) => \(/);
  assert.doesNotMatch(view, /\{catalog\.map\(\(item\) => \(/);

  assert.match(workItem, /WI-0818/i);
  assert.match(workItem, /inactive|history|benefit|name/i);
  assert.match(roadmap, /WI-0818/i);
}

run()
  .then(() => {
    console.log("e2e-wi0818-benefits-history-name-resolution-with-inactive-catalog.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
