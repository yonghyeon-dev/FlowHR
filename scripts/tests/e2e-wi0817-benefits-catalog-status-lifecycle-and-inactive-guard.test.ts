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
  const statusRoute = readUtf8(
    "src",
    "app",
    "api",
    "benefits",
    "catalog",
    "[benefitId]",
    "status",
    "route.ts"
  );
  const requestsRoute = readUtf8("src", "app", "api", "benefits", "requests", "route.ts");
  const decisionRoute = readUtf8(
    "src",
    "app",
    "api",
    "benefits",
    "requests",
    "[requestId]",
    "decision",
    "route.ts"
  );
  const adminWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const adminWorkspaceView = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const employeeWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const employeeWorkspaceView = readUtf8(
    "src",
    "components",
    "benefits",
    "EmployeeBenefitsWorkspaceView.tsx"
  );
  const copy = readUtf8("src", "components", "benefits", "copy.ts");
  const contract = readUtf8("specs", "people", "contract.yaml");
  const api = readUtf8("specs", "people", "api.yaml");
  const testCases = readUtf8("specs", "people", "test-cases.md");
  const workItem = readUtf8(
    "work-items",
    "WI-0817-benefits-catalog-status-lifecycle-and-inactive-guard.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(statusRoute, /POST\s*\(request: Request, context: RouteContext\)/);
  assert.match(statusRoute, /benefits\.catalog\.status\.forbidden/);
  assert.match(statusRoute, /updateBenefitCatalogItemStatus/);

  assert.match(requestsRoute, /benefits\.catalog\.organization_mismatch/);
  assert.match(requestsRoute, /benefits\.catalog\.inactive/);
  assert.match(decisionRoute, /benefits\.request\.decision\.invalid_state/);

  assert.ok(countLines(adminWorkspace) <= 300, "AdminBenefitsWorkspace.tsx should stay <=300 lines");
  assert.ok(countLines(employeeWorkspace) <= 300, "EmployeeBenefitsWorkspace.tsx should stay <=300 lines");

  assert.match(adminWorkspace, /catalogStatus/);
  assert.match(adminWorkspace, /\/api\/benefits\/catalog\/\$\{encodeURIComponent\(benefitId\)\}\/status/);
  assert.match(adminWorkspaceView, /onUpdateCatalogStatus/);
  assert.match(adminWorkspaceView, /copy\.catalogStatusLabel/);
  assert.match(employeeWorkspace, /copy\.messages\.inactiveCatalog/);
  assert.match(employeeWorkspaceView, /\{" · "\}/);
  assert.match(copy, /catalogStatusLabel/);

  assert.match(contract, /^version:\s*0\.3\.6/m);
  assert.match(contract, /path:\s*\/benefits\/catalog\/\{benefitId\}\/status/);
  assert.match(api, /version:\s*0\.3\.6/);
  assert.match(api, /\/benefits\/catalog\/\{benefitId\}\/status:/);
  assert.match(testCases, /Contract v0\.3\.6/);

  assert.match(workItem, /WI-0817/i);
  assert.match(workItem, /inactive|catalog status|benefits/i);
  assert.match(roadmap, /WI-0817/i);
}

run()
  .then(() => {
    console.log("e2e-wi0817-benefits-catalog-status-lifecycle-and-inactive-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
