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
  const panelsSource = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptPanels.tsx");
  const copyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0593-withholding-receipt-validation-summary.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copyRuntime, /validationSummaryTitle:/);
  assert.match(copyRuntime, /validationFailedItemsLabel:/);
  assert.match(copyRuntime, /validationMissingGuardLabel:/);
  assert.match(copyRuntime, /validationStatusNeedsAction:/);
  assert.match(copyRuntime, /validationStatusReady:/);
  assert.match(copyRuntime, /validationActionHint:/);

  assert.match(panelsSource, /validationBlockedCount: number;/);
  assert.match(panelsSource, /validationMissingGuardCount: number;/);
  assert.match(panelsSource, /validationNeedsAction: boolean;/);
  assert.match(panelsSource, /copy\.validationSummaryTitle/);
  assert.match(panelsSource, /copy\.validationStatusLabel/);
  assert.match(panelsSource, /copy\.validationStatusNeedsAction/);
  assert.match(panelsSource, /copy\.validationStatusReady/);
  assert.match(panelsSource, /copy\.validationActionHint/);

  assert.match(consoleSource, /const validationBlockedCount = receipt\?\.receipt\.blockingReasons\.length \?\? 0;/);
  assert.match(consoleSource, /const validationMissingGuardCount = receipt/);
  assert.match(consoleSource, /const validationNeedsAction = validationBlockedCount > 0 \|\| validationMissingGuardCount > 0;/);
  assert.match(consoleSource, /validationBlockedCount=\{validationBlockedCount\}/);
  assert.match(consoleSource, /validationMissingGuardCount=\{validationMissingGuardCount\}/);
  assert.match(consoleSource, /validationNeedsAction=\{validationNeedsAction\}/);

  assert.ok(
    countLines(consoleSource) <= 300,
    `WithholdingReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(consoleSource)})`
  );
  assert.ok(
    countLines(copyRuntime) <= 380,
    `copy-runtime.ts must stay <= 380 lines (current: ${countLines(copyRuntime)})`
  );

  assert.match(workItem, /WI-0593/i);
  assert.match(workItem, /withholding|validation|summary|blocked|guard|receipt/i);
  assert.match(roadmap, /WI-0593/i);
}

run()
  .then(() => {
    console.log("e2e-wi0593-withholding-receipt-validation-summary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
