import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8("work-items", "WI-1140-admin-hub-visual-shell-baseline.md");

  assert.match(adminLayout, /className="saas-shell admin-shell"/);
  assert.match(adminLayout, /className="saas-sidebar admin-sidebar"/);
  assert.match(adminLayout, /admin-sidebar-copy/);

  assert.match(adminPage, /className="saas-content admin-hub-shell"/);
  assert.match(adminPage, /className="page-header admin-hub-hero"/);
  assert.match(adminPage, /admin-hub-hero-meta/);
  assert.match(adminPage, /admin-hub-queue-grid/);
  assert.match(adminPage, /admin-hub-workspace-grid/);

  assert.match(globalsCss, /\.admin-shell \{/);
  assert.match(globalsCss, /\.admin-sidebar-copy \{/);
  assert.match(globalsCss, /\.admin-hub-hero \{/);
  assert.match(globalsCss, /\.admin-hub-chip \{/);
  assert.match(globalsCss, /\.admin-hub-workspace-grid \{/);

  assert.match(workItem, /WI-1140/);
  assert.match(workItem, /관리자 허브 시각 셸 베이스라인/);
}

run()
  .then(() => {
    console.log("e2e-wi1140-admin-hub-visual-shell-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
