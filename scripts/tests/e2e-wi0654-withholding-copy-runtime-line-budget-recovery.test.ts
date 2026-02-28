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
  const copyRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0654-withholding-copy-runtime-line-budget-recovery.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(copyRuntime) <= 380,
    `withholding-receipt/copy-runtime.ts should stay <= 380 lines (current: ${countLines(copyRuntime)})`
  );
  assert.match(copyRuntime, /export function parseRequiredInt\(/);
  assert.match(copyRuntime, /export function resolveWithholdingBlockingReasons\(/);
  assert.match(copyRuntime, /export function normalizeWithholdingDocumentFileName\(/);
  assert.match(copyRuntime, /export function formatDateTimeByLocale\(/);

  assert.match(workItem, /WI-0654/i);
  assert.match(workItem, /withholding|copy-runtime|line budget|recovery/i);
  assert.match(roadmap, /WI-0654/i);
}

run()
  .then(() => {
    console.log("e2e-wi0654-withholding-copy-runtime-line-budget-recovery.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
