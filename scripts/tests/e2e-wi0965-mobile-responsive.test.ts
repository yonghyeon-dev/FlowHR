import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-0965-mobile-responsive.md");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(wi, /WI-0965/);
  assert.match(wi, /@media \(max-width: 768px\)/);
  assert.match(wi, /터치 타겟 최소 44px/);
  assert.match(wi, /ADR/);
  assert.match(wi, /Not required/);

  assert.match(globalCss, /@media \(max-width: 768px\)\s*\{/);
  assert.match(globalCss, /\.saas-sidebar\s*\{[\s\S]*display:\s*none !important;/);
  assert.match(globalCss, /\.saas-main\s*\{[\s\S]*width:\s*100%;/);
  assert.match(globalCss, /\.saas-content\s*\{[\s\S]*max-width:\s*100%;/);
  assert.match(globalCss, /\.notification-bell\s*\{[\s\S]*width:\s*44px;/);
  assert.match(globalCss, /\.notification-bell\s*\{[\s\S]*height:\s*44px;/);
  assert.match(globalCss, /\.session-menu\s*\.btn,[\s\S]*min-height:\s*44px;/);
}

run();
console.log("e2e-wi0965-mobile-responsive.test passed");
