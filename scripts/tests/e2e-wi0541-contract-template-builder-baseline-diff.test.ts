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
  const builder = readUtf8("src", "components", "contracts", "ContractTemplateBuilder.tsx");
  const helpers = readUtf8("src", "components", "contracts", "template-builder-helpers.ts");
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0541-contract-template-builder-baseline-diff.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(builder, /const \[baselineBody, setBaselineBody\] = useState\(""\)/);
  assert.match(builder, /buildTemplateBodyDiffSummary/);
  assert.match(builder, /function captureBaseline\(\)/);
  assert.match(builder, /setBaselineBody\(templateBody\)/);
  assert.match(builder, /copy\.captureBaselineAction/);
  assert.match(builder, /copy\.resetBaselineAction/);
  assert.match(builder, /copy\.diffPanelTitle/);
  assert.match(builder, /templateDiff\.addedLines/);
  assert.match(builder, /templateDiff\.removedLines/);
  assert.match(builder, /copy\.diffNoChangesLabel/);

  assert.match(helpers, /export type TemplateBodyDiffSummary = \{/);
  assert.match(helpers, /export function buildTemplateBodyDiffSummary/);
  assert.match(helpers, /const baselineLines = baselineBody/);
  assert.match(helpers, /addedLines/);
  assert.match(helpers, /removedLines/);

  assert.match(copy, /diffPanelTitle:/);
  assert.match(copy, /captureBaselineAction:/);
  assert.match(copy, /resetBaselineAction:/);
  assert.match(copy, /baselineCapturedMessage:/);
  assert.match(copy, /noBaselineMessage:/);
  assert.match(copy, /diffAddedCountLabel:/);
  assert.match(copy, /diffRemovedCountLabel:/);
  assert.match(copy, /diffNoChangesLabel:/);

  assert.ok(
    countLines(builder) <= 300,
    `ContractTemplateBuilder.tsx should stay <= 300 lines (current: ${countLines(builder)})`
  );
  assert.ok(
    countLines(helpers) <= 140,
    `template-builder-helpers.ts should stay <= 140 lines (current: ${countLines(helpers)})`
  );

  assert.match(workItem, /WI-0541/i);
  assert.match(workItem, /template|builder|baseline|diff|version/i);
  assert.match(roadmap, /WI-0541/i);
}

run()
  .then(() => {
    console.log("e2e-wi0541-contract-template-builder-baseline-diff.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
