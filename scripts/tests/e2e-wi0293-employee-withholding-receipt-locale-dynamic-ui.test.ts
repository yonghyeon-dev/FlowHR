import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const source = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptConsole.tsx");
  const workItem = readUtf8("work-items", "WI-0293-employee-withholding-receipt-locale-dynamic-ui.md");

  assert.match(source, /useI18n\(\)/);
  assert.match(source, /withholdingReceiptCopyByLocale: Record<FlowLocale, WithholdingReceiptCopy>/);
  assert.match(source, /title:\s*"원천징수영수증"/);
  assert.match(source, /title:\s*"Withholding Receipt"/);
  assert.match(source, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(source, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(source, /copy\.actionPreviewReceipt/);
  assert.match(source, /copy\.receiptSummaryTitle/);
  assert.match(source, /copy\.apiLogsTitle/);

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

