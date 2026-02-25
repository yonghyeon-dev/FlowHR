import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function lineCount(...parts: string[]) {
  return readUtf8(...parts).split(/\r?\n/).length;
}

async function run() {
  const pageHelpers = readUtf8("src", "app", "employee", "payslips", "page-helpers.ts");
  const compareHelpers = readUtf8("src", "app", "employee", "payslips", "page-compare-helpers.ts");
  const derivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const sharedSections = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-shared-sections.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0479-payslips-page-helpers-and-derived-state-budget-split.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    pageHelpers,
    /export\s*\{\s*buildCompareInsightCards,\s*buildCompareMetrics,\s*formatPercent\s*\}\s*from/
  );
  assert.match(compareHelpers, /export function buildCompareMetrics\(/);
  assert.match(compareHelpers, /export function buildCompareInsightCards\(/);
  assert.match(compareHelpers, /export function formatPercent\(/);

  assert.match(derivedState, /buildCompareMetrics\(/);
  assert.match(derivedState, /buildCompareInsightCards\(/);
  assert.match(sharedSections, /formatPercent\(metric\.diffRate\)/);

  assert.ok(
    lineCount("src", "app", "employee", "payslips", "page-helpers.ts") <= 300,
    "page-helpers.ts must be <= 300 lines"
  );
  assert.ok(
    lineCount("src", "app", "employee", "payslips", "page-compare-helpers.ts") <= 300,
    "page-compare-helpers.ts must be <= 300 lines"
  );

  assert.match(workItem, /WI-0479/i);
  assert.match(workItem, /payslips|helpers|derived|budget|split/i);
  assert.match(roadmap, /WI-0479/i);
}

run()
  .then(() => {
    console.log("e2e-wi0479-payslips-page-helpers-and-derived-state-budget-split.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
