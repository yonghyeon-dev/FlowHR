import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const globalsCss = readUtf8("src", "app", "globals.css");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1206-admin-payroll-filing-side-rail-mobile-follow-up.md"
  );

  assert.match(globalsCss, /@media \(max-width: 720px\)/);
  assert.match(globalsCss, /\.admin-payroll-side-rail \{/);
  assert.match(globalsCss, /\.admin-payroll-side-rail \.panel-actions/);
  assert.match(globalsCss, /\.admin-payroll-side-rail \.panel-actions \.btn/);
  assert.match(globalsCss, /\.admin-payroll-recovery-card \.simple-list li/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1206-admin-payroll-filing-side-rail-mobile-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1206`/);
  assert.match(workItem, /WI-1206/);
}

run();
console.log("e2e-wi1206-admin-payroll-filing-side-rail-mobile-follow-up.test passed");
