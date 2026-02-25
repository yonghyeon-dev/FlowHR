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
  const consoleSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const panelsSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptPanels.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0440-withholding-receipt-console-panel-decomposition-phase1.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(consoleSource, /WithholdingSummaryPanel/);
  assert.match(consoleSource, /WithholdingLogsPanel/);
  assert.match(consoleSource, /async function runRequest<\w+>\(/);
  assert.match(consoleSource, /function isErrorPayload\(value: unknown\)/);
  assert.ok(
    countLines(consoleSource) <= 670,
    `WithholdingReceiptConsole.tsx must stay <= 670 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(panelsSource, /export function WithholdingSummaryPanel\(/);
  assert.match(panelsSource, /export function WithholdingLogsPanel\(/);
  assert.match(panelsSource, /copy\.actionDownloadLoadedDocument/);
  assert.match(panelsSource, /copy\.apiLogsTotalLabel/);

  assert.match(workItem, /WI-0440/i);
  assert.match(workItem, /withholding|decomposition|panel|line budget|phase1/i);
  assert.match(roadmap, /WI-0440/i);
}

run()
  .then(() => {
    console.log("e2e-wi0440-withholding-receipt-console-panel-decomposition-phase1.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
