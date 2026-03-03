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
  const adminWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const adminView = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspaceView.tsx");
  const contract = readUtf8("specs", "people", "contract.yaml");
  const api = readUtf8("specs", "people", "api.yaml");
  const testCases = readUtf8("specs", "people", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-0819-benefits-catalog-deactivate-pending-guard.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(statusRoute, /listBenefitRequests\(\{\s*organizationId: existing\.organizationId,\s*status: "SUBMITTED"/s);
  assert.match(statusRoute, /benefits\.catalog\.deactivate\.pending_requests/);
  assert.match(statusRoute, /pendingSubmittedCount/);

  assert.ok(
    countLines(adminWorkspace) <= 300,
    `AdminBenefitsWorkspace.tsx should stay under 300 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.match(adminView, /pendingSubmittedCountByBenefitId/);
  assert.match(adminView, /copy\.requestStatus\.SUBMITTED/);
  assert.match(adminView, /disabled=\{hasPendingSubmitted\}/);

  assert.match(contract, /^version:\s*0\.3\.5/m);
  assert.match(contract, /deactivate guard for pending submitted requests/);
  assert.match(api, /version:\s*0\.3\.5/);
  assert.match(api, /Pending submitted requests block deactivation/);
  assert.match(testCases, /Contract v0\.3\.5/);
  assert.match(testCases, /deactivate an item with submitted pending requests/);

  assert.match(workItem, /WI-0819/i);
  assert.match(workItem, /deactivate|pending/i);
  assert.match(roadmap, /WI-0819/i);
}

run()
  .then(() => {
    console.log("e2e-wi0819-benefits-catalog-deactivate-pending-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
