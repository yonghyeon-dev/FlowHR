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
  const schema = readUtf8("src", "features", "benefits", "schemas.ts");
  const store = readUtf8("src", "features", "benefits", "store.ts");
  const requestsRoute = readUtf8("src", "app", "api", "benefits", "requests", "route.ts");
  const adminWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const contract = readUtf8("specs", "people", "contract.yaml");
  const api = readUtf8("specs", "people", "api.yaml");
  const testCases = readUtf8("specs", "people", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-0820-benefits-request-pending-priority-sort.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schema, /benefitRequestSortSchema = z\.enum\(\["updated_desc", "pending_priority"\]\)/);
  assert.match(schema, /listBenefitRequestsQuerySchema[\s\S]*sort: benefitRequestSortSchema\.optional\(\)/);

  assert.match(store, /const BENEFIT_REQUEST_STATUS_PRIORITY: Record<BenefitRequestStatus, number>/);
  assert.match(store, /if \(sort !== "pending_priority"\)/);
  assert.match(store, /left\.status === "SUBMITTED" && right\.status === "SUBMITTED"/);
  assert.match(store, /const byRequestedAt = leftRequestedAt - rightRequestedAt/);
  assert.match(
    store,
    /export function listBenefitRequests[\s\S]*const sort = normalizeRequestSort\(input\.sort\)/
  );
  assert.match(
    store,
    /export function listBenefitRequests[\s\S]*sortBenefitRequestItems\(rows\.map\(toRequestItem\), sort\)/
  );

  assert.match(requestsRoute, /sort: url\.searchParams\.get\("sort"\) \?\? undefined/);
  assert.match(requestsRoute, /sort: parsed\.data\.sort/);

  assert.ok(
    countLines(adminWorkspace) <= 300,
    `AdminBenefitsWorkspace.tsx should stay under 300 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.match(adminWorkspace, /buildBenefitWorkspaceQuery\(\{ organizationId, sort: "pending_priority" \}\)/);

  assert.match(contract, /^version:\s*0\.3\.6/m);
  assert.match(contract, /sort=pending_priority/);
  assert.match(api, /version:\s*0\.3\.6/);
  assert.match(api, /name:\s*sort/);
  assert.match(api, /pending_priority/);
  assert.match(testCases, /Contract v0\.3\.6/);
  assert.match(testCases, /sort=pending_priority/);

  assert.match(workItem, /WI-0820/i);
  assert.match(workItem, /pending|priority|sort/i);
  assert.match(roadmap, /WI-0820/i);
}

run()
  .then(() => {
    console.log("e2e-wi0820-benefits-request-pending-priority-sort.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
