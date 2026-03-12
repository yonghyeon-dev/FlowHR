import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const bridgeCss = readUtf8("src", "app", "v2-bridge.css");
  const designSystemCss = readUtf8("src", "app", "v2-design-system.css");
  const workItem = readUtf8("work-items", "WI-1140-admin-hub-visual-shell-baseline.md");

  assert.match(adminLayout, /className="app-shell"/);
  assert.match(adminLayout, /className="app-header"/);
  assert.match(adminLayout, /className="app-sidebar"/);
  assert.match(adminLayout, /header-brand-link/);

  assert.match(adminPage, /className="saas-content admin-hub-shell"/);
  assert.match(adminPage, /className="page-header admin-hub-hero"/);
  assert.match(adminPage, /admin-hub-hero-meta/);
  assert.match(adminPage, /admin-hub-queue-grid/);
  assert.match(adminPage, /admin-hub-workspace-grid/);

  assert.match(bridgeCss, /\.app-main-scroll \{/);
  assert.match(bridgeCss, /\.header-brand-link \{/);
  assert.match(designSystemCss, /\.app-shell \{/);
  assert.match(designSystemCss, /\.app-header \{/);
  assert.match(designSystemCss, /\.app-sidebar \{/);

  assert.match(workItem, /WI-1140/);
}

run()
  .then(() => {
    console.log("e2e-wi1140-admin-hub-visual-shell-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
