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
  const consoleSource = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptConsole.tsx");
  const panels = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptPanels.tsx");
  const copyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0553-withholding-receipt-document-metadata-copy-action.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copyRuntime, /actionCopyDocumentMetadata: string;/);
  assert.match(copyRuntime, /copiedDocumentMetadataStatus: string;/);

  assert.match(panels, /actionCopyDocumentMetadata: string;/);
  assert.match(panels, /onCopyDocumentMetadata: \(document: WithholdingReceiptDocumentResponse\["document"\]\) => void;/);
  assert.match(panels, /copy\.actionCopyDocumentMetadata/);
  assert.match(panels, /onCopyDocumentMetadata\(receiptDocument\.document\)/);

  assert.match(consoleSource, /async function copyDocumentMetadata/);
  assert.match(consoleSource, /navigator\.clipboard\.writeText/);
  assert.match(consoleSource, /setStatusMessage\(copy\.copiedDocumentMetadataStatus\)/);
  assert.match(consoleSource, /onCopyDocumentMetadata=\{\(document\) => void copyDocumentMetadata\(document\)\}/);

  assert.ok(
    countLines(consoleSource) <= 300,
    `WithholdingReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(workItem, /WI-0553/i);
  assert.match(workItem, /withholding|receipt|document|metadata|copy|action/i);
  assert.match(roadmap, /WI-0553/i);
}

run()
  .then(() => {
    console.log("e2e-wi0553-withholding-receipt-document-metadata-copy-action.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
