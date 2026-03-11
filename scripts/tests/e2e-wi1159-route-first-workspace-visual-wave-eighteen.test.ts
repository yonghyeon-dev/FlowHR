import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1159-route-first-workspace-visual-wave-eighteen.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const yearEndConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndConsole.tsx"
  );
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const withholdingConsole = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );

  assert.match(wi, /WI-1159/);
  assert.match(
    progress,
    /Closed `WI-1158` with merge `bd26e43199695708239fe24772092ed6da213d41`/
  );
  assert.match(progress, /Started `WI-1159`/);

  assert.match(yearEndConsole, /workspace-shell admin-workspace-shell/);
  assert.match(yearEndConsole, /workspace-summary-strip/);
  assert.match(yearEndConsole, /workspace-toolbar-card/);
  assert.match(yearEndConsole, /openPreflightChecklistAction/);

  assert.match(filingConsole, /workspace-shell admin-workspace-shell/);
  assert.match(filingConsole, /workspace-summary-strip/);
  assert.match(filingConsole, /workspace-toolbar-card/);
  assert.match(filingConsole, /backToYearEndAction/);

  assert.match(withholdingConsole, /workspace-shell employee-workspace-shell/);
  assert.match(withholdingConsole, /workspace-summary-strip/);
  assert.match(withholdingConsole, /workspace-panel-grid/);
  assert.match(withholdingConsole, /returnToEmployeeLabel/);
}

run();
console.log("e2e-wi1159-route-first-workspace-visual-wave-eighteen.test passed");
