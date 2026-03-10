import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const failureGuidance = readUtf8("src", "components", "payroll-year-end", "request-failure-guidance.ts");
  const exportBundle = readUtf8("src", "components", "payroll-year-end-filing", "FilingExportBundle.tsx");
  const workItem = readUtf8("work-items", "WI-1064-year-end-filing-guidance-copy.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const gapInventory = readUtf8("docs", "production-gap-inventory.md");

  assert.doesNotMatch(
    failureGuidance,
    /ACK 처리/,
    "filing failure guidance must not expose raw ACK wording in Korean recovery messages"
  );
  assert.doesNotMatch(
    failureGuidance,
    /Acknowledge or cancel it before trying again\./,
    "filing failure guidance must not expose raw acknowledge wording in English recovery messages"
  );
  assert.doesNotMatch(
    failureGuidance,
    /This filing submission is already acknowledged\./,
    "filing failure guidance must not expose raw acknowledged state wording"
  );

  assert.match(exportBundle, /const \{ locale \} = useI18n\(\);/);
  assert.match(exportBundle, /title: "워크플로 요약"/);
  assert.doesNotMatch(exportBundle, /<h3>Workflow overview<\/h3>/);
  assert.doesNotMatch(exportBundle, /Tracking item/);
  assert.doesNotMatch(exportBundle, /Alert severity/);

  assert.match(workItem, /WI-1064/i);
  assert.match(progress, /WI-1064/i);
  assert.match(gapInventory, /WI-1064/i);
}

run()
  .then(() => {
    console.log("e2e-wi1064-year-end-filing-guidance-copy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
