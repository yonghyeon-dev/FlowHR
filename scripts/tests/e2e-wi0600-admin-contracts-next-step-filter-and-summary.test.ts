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
  const filters = readUtf8("src", "components", "contracts", "useAdminContractsDocumentFilters.ts");
  const controls = readUtf8("src", "components", "contracts", "AdminContractsDocumentFilterControls.tsx");
  const workspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0600-admin-contracts-next-step-filter-and-summary.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(filters, /export type ContractDocumentNextStepFilter = ContractDocumentNextStepKey \| "ALL"/);
  assert.match(filters, /const \[nextStepFilter, setNextStepFilter\] = useState<ContractDocumentNextStepFilter>\("ALL"\)/);
  assert.match(filters, /const nextStepCounts = useMemo/);
  assert.match(filters, /if \(nextStepFilter !== "ALL" && nextStep !== nextStepFilter\)/);

  assert.match(controls, /nextStepFilter: ContractDocumentNextStepFilter/);
  assert.match(controls, /onNextStepFilterChange: \(value: ContractDocumentNextStepFilter\) => void/);
  assert.match(controls, /nextStepCounts: Record<ContractDocumentNextStepKey, number>/);
  assert.match(controls, /copy\.nextStepFilterLabel/);
  assert.match(controls, /copy\.nextStepSummaryLabel/);

  assert.match(workspace, /nextStepFilter=\{nextStepFilter\}/);
  assert.match(workspace, /onNextStepFilterChange=\{setNextStepFilter\}/);
  assert.match(workspace, /nextStepCounts=\{nextStepCounts\}/);

  assert.match(copy, /nextStepFilterLabel:/);
  assert.match(copy, /nextStepAllOption:/);
  assert.match(copy, /nextStepSummaryLabel:/);

  assert.ok(
    countLines(workspace) <= 260,
    `AdminContractsWorkspace.tsx should stay <= 260 lines (current: ${countLines(workspace)})`
  );

  assert.match(workItem, /WI-0600/i);
  assert.match(workItem, /contracts|next-step|filter|summary|queue/i);
  assert.match(roadmap, /WI-0600/i);
}

run()
  .then(() => {
    console.log("e2e-wi0600-admin-contracts-next-step-filter-and-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
