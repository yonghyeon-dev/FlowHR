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
  const copyRuntimeSource = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0442-withholding-receipt-copy-runtime-extraction-and-line-budget-300.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(consoleSource, /from "@\/components\/withholding-receipt\/copy-runtime"/);
  assert.match(consoleSource, /async function runRequest<\w+>\(/);
  assert.match(consoleSource, /function isErrorPayload\(value: unknown\)/);
  assert.ok(
    countLines(consoleSource) <= 300,
    `WithholdingReceiptConsole.tsx must stay <= 300 lines (current: ${countLines(consoleSource)})`
  );

  assert.match(copyRuntimeSource, /export type WithholdingReceiptCopy =/);
  assert.match(copyRuntimeSource, /export const withholdingReceiptCopyByLocale/);
  assert.match(copyRuntimeSource, /export function normalizeRuntimeDiagnosticMessage\(/);
  assert.match(copyRuntimeSource, /export function resolveWithholdingBlockingReasons\(/);
  assert.match(copyRuntimeSource, /export function parseRequiredInt\(/);

  assert.match(workItem, /WI-0442/i);
  assert.match(workItem, /withholding|copy|runtime|line budget/i);
  assert.match(roadmap, /WI-0442/i);
}

run()
  .then(() => {
    console.log("e2e-wi0442-withholding-receipt-copy-runtime-extraction-and-line-budget-300.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
