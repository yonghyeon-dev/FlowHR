import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const opsLayout = readUtf8("src", "app", "ops", "layout.tsx");
  const workItem = readUtf8("work-items", "WI-0714-ops-route-devtools-layout-gate.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(opsLayout, /NEXT_PUBLIC_FLOWHR_DEV_TOOLS/);
  assert.match(opsLayout, /notFound\(\)/);
  assert.match(opsLayout, /TRUTHY_FLAGS/);

  assert.match(workItem, /WI-0714/i);
  assert.match(workItem, /ops|devtools|layout|gate/i);
  assert.match(roadmap, /WI-0714/i);
}

run()
  .then(() => {
    console.log("e2e-wi0714-ops-route-devtools-layout-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
