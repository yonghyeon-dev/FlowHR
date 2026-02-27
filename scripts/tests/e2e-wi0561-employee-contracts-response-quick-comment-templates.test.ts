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
  const responsePanel = readUtf8("src", "components", "contracts", "EmployeeContractsResponsePanel.tsx");
  const contractsCopy = readUtf8("src", "components", "contracts", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0561-employee-contracts-response-quick-comment-templates.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(responsePanel, /quickCommentTemplatesLabel/);
  assert.match(responsePanel, /quickCommentTemplateConfirmTerms/);
  assert.match(responsePanel, /quickCommentTemplateNeedClarification/);
  assert.match(responsePanel, /quickCommentTemplateRequestRevision/);
  assert.match(responsePanel, /onClick=\{\(\) => onCommentChange\(template\)\}/);

  assert.match(contractsCopy, /quickCommentTemplatesLabel:/);
  assert.match(contractsCopy, /quickCommentTemplateConfirmTerms:/);
  assert.match(contractsCopy, /quickCommentTemplateNeedClarification:/);
  assert.match(contractsCopy, /quickCommentTemplateRequestRevision:/);
  assert.match(contractsCopy, /quickCommentTemplatesLabel: "Quick comment templates"/);
  assert.match(contractsCopy, /quickCommentTemplatesLabel: "빠른 의견 템플릿"/);

  assert.ok(
    countLines(responsePanel) <= 160,
    `EmployeeContractsResponsePanel.tsx should stay <= 160 lines (current: ${countLines(responsePanel)})`
  );

  assert.match(workItem, /WI-0561/i);
  assert.match(workItem, /employee|contracts|response|quick comment|template/i);
  assert.match(roadmap, /WI-0561/i);
}

run()
  .then(() => {
    console.log("e2e-wi0561-employee-contracts-response-quick-comment-templates.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
