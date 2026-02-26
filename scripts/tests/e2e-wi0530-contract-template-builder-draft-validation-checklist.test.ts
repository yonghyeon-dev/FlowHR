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
  const checklist = readUtf8(
    "src",
    "components",
    "contracts",
    "template-builder-checklist.tsx"
  );
  const copy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0530-contract-template-builder-draft-validation-checklist.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(builder, /buildTemplateValidationChecklist/);
  assert.match(builder, /ContractTemplateValidationChecklist/);
  assert.match(builder, /const canCreateTemplate = validationChecklist\.every/);
  assert.match(builder, /if \(!canCreateTemplate\)/);
  assert.match(builder, /setError\(copy\.validationFailedMessage\)/);
  assert.match(builder, /disabled=\{pending \|\| !canCreateTemplate\}/);

  assert.match(checklist, /export function buildTemplateValidationChecklist/);
  assert.match(checklist, /const hasDuplicateTitle =/);
  assert.match(checklist, /checklistDuplicateRule/);
  assert.match(checklist, /ContractTemplateValidationChecklist/);

  assert.match(copy, /validationFailedMessage:/);
  assert.match(copy, /checklistTitle:/);
  assert.match(copy, /checklistReadyLabel:/);
  assert.match(copy, /checklistNeedsFixLabel:/);
  assert.match(copy, /checklistNameRule:/);
  assert.match(copy, /checklistClauseRule:/);
  assert.match(copy, /checklistRequiredRule:/);
  assert.match(copy, /checklistDuplicateRule:/);

  assert.ok(
    countLines(builder) <= 300,
    `ContractTemplateBuilder.tsx should stay <= 300 lines (current: ${countLines(builder)})`
  );
  assert.ok(
    countLines(checklist) <= 180,
    `template-builder-checklist.tsx should stay <= 180 lines (current: ${countLines(checklist)})`
  );

  assert.match(workItem, /WI-0530/i);
  assert.match(workItem, /contract|template|validation|checklist|draft/i);
  assert.match(roadmap, /WI-0530/i);
}

run()
  .then(() => {
    console.log("e2e-wi0530-contract-template-builder-draft-validation-checklist.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

