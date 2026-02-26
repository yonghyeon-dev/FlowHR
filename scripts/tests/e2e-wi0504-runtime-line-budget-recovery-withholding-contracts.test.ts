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
  const withholdingRuntime = readUtf8("src", "components", "withholding-receipt", "copy-runtime.ts");
  const contractsHttp = readUtf8("src", "components", "contracts", "http.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0504-runtime-line-budget-recovery-withholding-contracts.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(withholdingRuntime) <= 380,
    `withholding-receipt/copy-runtime.ts should stay <= 380 lines (current: ${countLines(withholdingRuntime)})`
  );
  assert.ok(
    countLines(contractsHttp) <= 220,
    `contracts/http.ts should stay <= 220 lines (current: ${countLines(contractsHttp)})`
  );

  assert.match(withholdingRuntime, /const withholdingBlockingReasonKoMap: Record<string, string> = \{/);
  assert.match(withholdingRuntime, /const koRuntimeDiagnosticPatterns: Array<\{ pattern: RegExp; message: string \}> = \[/);
  assert.match(withholdingRuntime, /export function normalizeRuntimeDiagnosticMessage\(/);
  assert.match(contractsHttp, /const koContractsErrorMessagePatterns: Array<\{ pattern: RegExp; message: string \}> = \[/);
  assert.match(contractsHttp, /export async function readJson\(response: Response, fallbackMessage\?: string\)/);

  assert.match(workItem, /WI-0504/i);
  assert.match(workItem, /runtime|line budget|withholding|contracts/i);
  assert.match(roadmap, /WI-0504/i);
}

run()
  .then(() => {
    console.log("e2e-wi0504-runtime-line-budget-recovery-withholding-contracts.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
