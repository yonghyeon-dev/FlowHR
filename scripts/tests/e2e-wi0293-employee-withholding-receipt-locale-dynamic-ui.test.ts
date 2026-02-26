import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptConsole.tsx");
  const inputPanelSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptInputPanel.tsx"
  );
  const requestHookSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "useWithholdingReceiptRequests.ts"
  );
  const copyRuntimeSource = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8("work-items", "WI-0293-employee-withholding-receipt-locale-dynamic-ui.md");

  assert.match(consoleSource, /useI18n\(\)/);
  assert.match(consoleSource, /from "@\/components\/withholding-receipt\/copy-runtime"/);
  assert.match(copyRuntimeSource, /withholdingReceiptCopyByLocale: Record<FlowLocale, WithholdingReceiptCopy>/);
  assert.match(copyRuntimeSource, /title:\s*"\uC6D0\uCC9C\uC9D5\uC218\uC601\uC218\uC99D"/);
  assert.match(copyRuntimeSource, /title:\s*"Withholding Receipt"/);
  assert.match(consoleSource, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US"/);
  assert.match(consoleSource, /WithholdingReceiptInputPanel/);
  assert.match(requestHookSource, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(inputPanelSource, /copy\.actionPreviewReceipt/);
  assert.match(consoleSource, /copy\.receiptSummaryTitle/);
  assert.match(consoleSource, /copy\.apiLogsTitle/);

  assert.match(workItem, /WI-0293/i);
  assert.match(workItem, /\/employee\/withholding-receipt/);
  assert.match(workItem, /browser|locale|language|ko|en/i);
}

run()
  .then(() => {
    console.log("e2e-wi0293-employee-withholding-receipt-locale-dynamic-ui.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
