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
  const barrel = readUtf8("src", "app", "employee", "payslips", "page-locale-copy.ts");
  const typesSource = readUtf8("src", "app", "employee", "payslips", "page-locale-types.ts");
  const searchSortSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const pageCopySource = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const deductionSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-deduction-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0451-payslips-locale-copy-modular-split-types-search-page-deduction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(barrel) <= 20,
    `page-locale-copy.ts should stay lightweight barrel <= 20 lines (current: ${countLines(barrel)})`
  );
  assert.match(barrel, /page-locale-types/);
  assert.match(barrel, /page-locale-search-sort-copy/);
  assert.match(barrel, /page-locale-page-copy/);
  assert.match(barrel, /page-locale-deduction-copy/);

  assert.match(typesSource, /export type PayslipSearchSortCopy =/);
  assert.match(typesSource, /export type PayslipPageCopy =/);
  assert.match(searchSortSource, /export function resolvePayslipSearchSortCopy\(/);
  assert.match(pageCopySource, /export function resolvePayslipPageCopy\(/);
  assert.match(deductionSource, /export function resolveDeductionDescriptionMap\(/);
  assert.match(deductionSource, /export function resolvePayslipRunStateLabel\(/);

  assert.ok(
    countLines(pageCopySource) <= 350,
    `page-locale-page-copy.ts should stay <= 350 lines (current: ${countLines(pageCopySource)})`
  );

  assert.match(workItem, /WI-0451/i);
  assert.match(workItem, /payslip|locale|copy|split|types|search|page|deduction/i);
  assert.match(roadmap, /WI-0451/i);
}

run()
  .then(() => {
    console.log("e2e-wi0451-payslips-locale-copy-modular-split-types-search-page-deduction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
