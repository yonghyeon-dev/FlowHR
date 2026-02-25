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
  const barrel = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const copySource = readUtf8("src", "app", "employee", "payslips", "page-locale-copy.ts");
  const typesSource = readUtf8("src", "app", "employee", "payslips", "page-locale-types.ts");
  const pageCopySource = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const searchSortSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const deductionSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-deduction-copy.ts"
  );
  const runtimeSource = readUtf8("src", "app", "employee", "payslips", "page-locale-runtime.ts");
  const workItem = readUtf8("work-items", "WI-0445-payslips-locale-helpers-split-copy-runtime-barrel.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(barrel, /from "@\/app\/employee\/payslips\/page-locale-copy"/);
  assert.match(barrel, /from "@\/app\/employee\/payslips\/page-locale-runtime"/);
  assert.ok(
    countLines(barrel) <= 40,
    `page-locale-helpers.ts should stay as small barrel <= 40 lines (current: ${countLines(barrel)})`
  );
  assert.ok(
    countLines(copySource) <= 30,
    `page-locale-copy.ts should stay lightweight barrel <= 30 lines (current: ${countLines(copySource)})`
  );

  assert.match(copySource, /from "@\/app\/employee\/payslips\/page-locale-types"/);
  assert.match(copySource, /from "@\/app\/employee\/payslips\/page-locale-page-copy"/);
  assert.match(copySource, /from "@\/app\/employee\/payslips\/page-locale-deduction-copy"/);
  assert.match(typesSource, /export type PayslipPageCopy =/);
  assert.match(pageCopySource, /export function resolvePayslipPageCopy\(/);
  assert.match(searchSortSource, /export function resolvePayslipSearchSortCopy\(/);
  assert.match(deductionSource, /export function resolveDeductionDescriptionMap\(/);

  assert.match(runtimeSource, /export function resolveRuntimeLocale\(/);
  assert.match(runtimeSource, /export function extractErrorMessage\(/);
  assert.match(runtimeSource, /export function formatDateTime\(/);

  assert.match(workItem, /WI-0445/i);
  assert.match(workItem, /payslip|locale|split|barrel/i);
  assert.match(roadmap, /WI-0445/i);
}

run()
  .then(() => {
    console.log("e2e-wi0445-payslips-locale-helper-split-copy-runtime.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
