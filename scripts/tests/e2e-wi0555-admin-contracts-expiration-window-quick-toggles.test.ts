import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const controls = readUtf8("src", "components", "contracts", "AdminContractsDocumentFilterControls.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0555-admin-contracts-expiration-window-quick-toggles.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(controls, /copy\.expirationWindowFilterLabel/);
  assert.match(controls, /onExpirationWindowDaysChange\("ALL"\)/);
  assert.match(controls, /onExpirationWindowDaysChange\("7"\)/);
  assert.match(controls, /onExpirationWindowDaysChange\("14"\)/);
  assert.match(controls, /onExpirationWindowDaysChange\("30"\)/);
  assert.match(controls, /copy\.expirationWindowAllOption/);
  assert.match(controls, /copy\.expirationWindow7Option/);
  assert.match(controls, /copy\.expirationWindow14Option/);
  assert.match(controls, /copy\.expirationWindow30Option/);

  assert.match(workItem, /WI-0555/i);
  assert.match(workItem, /admin|contracts|expiration|window|quick toggles|filter/i);
  assert.match(roadmap, /WI-0555/i);
}

run()
  .then(() => {
    console.log("e2e-wi0555-admin-contracts-expiration-window-quick-toggles.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
