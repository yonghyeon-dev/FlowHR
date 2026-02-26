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
  const filters = readUtf8("src", "components", "contracts", "useAdminContractsDocumentFilters.ts");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0540-admin-contracts-sla-risk-filter-and-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(filters, /export type ContractDocumentSlaRiskFilter = "ALL" \| "DUE_SOON" \| "OVERDUE"/);
  assert.match(filters, /const SLA_DUE_SOON_WINDOW_DAYS = 3/);
  assert.match(filters, /const dueSoonSlaCount = useMemo/);
  assert.match(filters, /const overdueSlaCount = useMemo/);
  assert.match(filters, /slaRiskFilter === "DUE_SOON"/);
  assert.match(filters, /slaRiskFilter === "OVERDUE"/);

  assert.match(workspace, /slaRiskFilter=\{slaRiskFilter\}/);
  assert.match(workspace, /dueSoonSlaCount=\{dueSoonSlaCount\}/);
  assert.match(workspace, /overdueSlaCount=\{overdueSlaCount\}/);
  assert.match(workspace, /isOverdueSlaRisk\(document\)/);
  assert.match(workspace, /copy\.slaOverdueBadgeLabel/);
  assert.match(workspace, /copy\.slaDueSoonBadgeLabel/);

  assert.match(controls, /copy\.slaRiskFilterLabel/);
  assert.match(controls, /copy\.slaRiskAllOption/);
  assert.match(controls, /copy\.slaRiskDueSoonOption/);
  assert.match(controls, /copy\.slaRiskOverdueOption/);

  assert.match(copy, /slaRiskFilterLabel:/);
  assert.match(copy, /slaRiskAllOption:/);
  assert.match(copy, /slaRiskDueSoonOption:/);
  assert.match(copy, /slaRiskOverdueOption:/);
  assert.match(copy, /overdueSlaCountLabel:/);
  assert.match(copy, /slaDueSoonBadgeLabel:/);
  assert.match(copy, /slaOverdueBadgeLabel:/);

  assert.ok(
    countLines(workspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(workspace)})`
  );

  assert.match(workItem, /WI-0540/i);
  assert.match(workItem, /contracts|sla|risk|filter|summary/i);
  assert.match(roadmap, /WI-0540/i);
}

run()
  .then(() => {
    console.log("e2e-wi0540-admin-contracts-sla-risk-filter-and-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

