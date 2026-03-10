import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panels = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptPanels.tsx");
  const consoleSource = readUtf8("src", "components", "withholding-receipt", "WithholdingReceiptConsole.tsx");
  const requests = readUtf8("src", "components", "withholding-receipt", "useWithholdingReceiptRequests.ts");
  const copy = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const workItem = readUtf8("work-items", "WI-1068-withholding-integrity-trace-cleanup.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.doesNotMatch(
    panels,
    /finalizedSettlement\.settlement\.finalizationId/,
    "withholding summary must not expose raw finalization identifiers"
  );
  assert.doesNotMatch(
    panels,
    /settlementHash\.slice\(0,\s*16\)/,
    "withholding summary must not expose settlement hash fragments"
  );
  assert.doesNotMatch(
    panels,
    /contentSha256\.slice\(0,\s*16\)/,
    "withholding document summary must not expose content hash fragments"
  );
  assert.doesNotMatch(
    consoleSource,
    /metadataContentSha256Label}: \$\{document\.contentSha256\}/,
    "copied metadata must not include raw content hashes"
  );
  assert.doesNotMatch(
    requests,
    /loadedFinalizedSettlementPrefix} \$\{body\.settlement\.finalizationId\}/,
    "status messages must not append raw finalization identifiers"
  );
  assert.match(copy, /documentIntegrityVerifiedLabel:/);

  assert.match(workItem, /WI-1068/i);
  assert.match(progress, /WI-1068/i);
  assert.match(gapInventory, /WI-1068/i);
}

run()
  .then(() => {
    console.log("e2e-wi1068-withholding-integrity-trace-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
