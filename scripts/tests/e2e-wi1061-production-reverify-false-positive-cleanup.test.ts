import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const reverifyScript = readUtf8(
    "codex_test",
    "production-completed-items-reverify.mjs"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1061-production-reverify-false-positive-cleanup.md"
  );
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(
    reverifyScript,
    /passed:\s*metrics\.visible \|\| finalUrl === "\/admin\/approval-executions"/,
    "admin approvals hash reverify must accept redirect-to-route behavior"
  );
  assert.match(
    reverifyScript,
    /const isExpectedNotFound =[\s\S]*response\?\.status\(\) === 404[\s\S]*finalUrl === "\/admin\/leave-promotion"/,
    "admin leave-promotion reverify must accept the intended dev-tools-off 404"
  );
  assert.match(workItem, /WI-1061/i);
  assert.match(progress, /WI-1061/i);
}

run()
  .then(() => {
    console.log("e2e-wi1061-production-reverify-false-positive-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
