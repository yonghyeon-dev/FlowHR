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
  const workspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const filters = readUtf8(
    "src",
    "components",
    "contracts",
    "useAdminContractsDocumentFilters.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0833-admin-contracts-deeplink-filter-hydration.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 320,
    `AdminContractsWorkspace.tsx should stay <= 320 lines (current: ${countLines(workspace)})`
  );

  assert.match(workspace, /import \{ useSearchParams \} from "next\/navigation"/);
  assert.match(workspace, /const searchParams = useSearchParams\(\);/);
  assert.match(workspace, /searchParams\.get\("q"\)/);
  assert.match(workspace, /searchParams\.get\("status"\)/);
  assert.match(workspace, /searchParams\.get\("expiresInDays"\)/);
  assert.match(workspace, /searchParams\.get\("slaRisk"\)/);
  assert.match(workspace, /searchParams\.get\("decisionQueueOnly"\)/);
  assert.match(workspace, /searchParams\.get\("renewalCandidateOnly"\)/);
  assert.match(workspace, /searchParams\.get\("nextStep"\)/);

  assert.match(filters, /export function parseContractDocumentSearchQuery/);
  assert.match(filters, /export function normalizeContractDocumentStatusFilter/);
  assert.match(filters, /export function normalizeContractDocumentExpirationWindow/);
  assert.match(filters, /export function normalizeContractDocumentSlaRiskFilter/);
  assert.match(filters, /export function normalizeContractDocumentNextStepFilter/);
  assert.match(filters, /export function parseContractBooleanFilter/);
  assert.match(filters, /initialFilters\?: \{/);

  assert.match(workItem, /WI-0833/i);
  assert.match(workItem, /admin|contracts|deeplink|filter|hydration/i);
  assert.match(roadmap, /WI-0833/i);
}

run()
  .then(() => {
    console.log("e2e-wi0833-admin-contracts-deeplink-filter-hydration.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
