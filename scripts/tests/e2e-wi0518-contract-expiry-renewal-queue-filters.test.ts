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
  const workItem = readUtf8("work-items", "WI-0518-contract-expiry-renewal-queue-filters.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(workspace)})`
  );

  assert.match(workspace, /expirationWindowDays/);
  assert.match(workspace, /renewalCandidateOnly/);
  assert.match(workspace, /expiringSoonCount/);
  assert.match(workspace, /renewalCandidateCount/);

  assert.match(controls, /copy\.expirationWindowFilterLabel/);
  assert.match(controls, /copy\.expirationWindowAllOption/);
  assert.match(controls, /copy\.renewalCandidateOnlyLabel/);
  assert.match(controls, /copy\.expiringSoonCountLabel/);
  assert.match(controls, /copy\.renewalCandidateCountLabel/);

  assert.match(filtersHook, /type ContractDocumentExpirationWindow = "ALL" \| "7" \| "14" \| "30"/);
  assert.match(filtersHook, /const \[expirationWindowDays, setExpirationWindowDays\] = useState/);
  assert.match(filtersHook, /const \[renewalCandidateOnly, setRenewalCandidateOnly\] = useState\(false\)/);
  assert.match(filtersHook, /renewalCandidateStatuses/);
  assert.match(filtersHook, /expiringSoonCount/);
  assert.match(filtersHook, /renewalCandidateCount/);

  assert.match(copy, /expirationWindowFilterLabel: "Expiry window"/);
  assert.match(copy, /renewalCandidateOnlyLabel: "Renewal candidates only"/);
  assert.match(copy, /expiringSoonCountLabel: "Expiring soon"/);
  assert.match(copy, /renewalCandidateCountLabel: "Renewal candidates"/);
  assert.match(copy, /expirationWindowFilterLabel: "만료 임박 기간"/);
  assert.match(copy, /renewalCandidateOnlyLabel: "갱신 후보만 보기"/);
  assert.match(copy, /expiringSoonCountLabel: "만료 임박"/);
  assert.match(copy, /renewalCandidateCountLabel: "갱신 후보"/);

  assert.match(workItem, /WI-0518/i);
  assert.match(workItem, /contracts|expiry|renewal|queue|filters/i);
  assert.match(roadmap, /WI-0518/i);
}

run()
  .then(() => {
    console.log("e2e-wi0518-contract-expiry-renewal-queue-filters.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
