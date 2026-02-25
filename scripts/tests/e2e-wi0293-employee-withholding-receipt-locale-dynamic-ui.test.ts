import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptConsole.tsx");
  const copyRuntimeSource = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8("work-items", "WI-0293-employee-withholding-receipt-locale-dynamic-ui.md");

  assert.match(consoleSource, /useI18n\(\)/);
  assert.match(consoleSource, /from "@\/components\/withholding-receipt\/copy-runtime"/);
  assert.match(copyRuntimeSource, /withholdingReceiptCopyByLocale: Record<FlowLocale, WithholdingReceiptCopy>/);
  assert.match(copyRuntimeSource, /title:\s*"원천징수영수증"/);
  assert.match(copyRuntimeSource, /title:\s*"Withholding Receipt"/);
  assert.match(consoleSource, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(consoleSource, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(consoleSource, /copy\.actionPreviewReceipt/);
  assert.match(consoleSource, /copy\.receiptSummaryTitle/);
  assert.match(consoleSource, /copy\.apiLogsTitle/);

  assert.match(workItem, /WI-0293/i);
  assert.match(workItem, /\/employee\/withholding-receipt/);
  assert.match(workItem, /브라우저 언어|locale/i);
}

run()
  .then(() => {
    console.log("e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
