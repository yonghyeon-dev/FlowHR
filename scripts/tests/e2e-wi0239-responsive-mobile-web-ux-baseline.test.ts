import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0239-responsive-mobile-web-ux-baseline.md");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const mobileMenu = readUtf8("src", "components", "layout", "SaasMobileMenu.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(roadmap, /WI-0239/);
  assert.match(workItem, /Responsive Mobile Web UX Baseline/);

  assert.match(messages, /"shell\.mobileMenu": "모바일 메뉴"/);
  assert.match(messages, /"shell\.mobileMenu": "Mobile Menu"/);

  assert.match(adminLayout, /SaasMobileMenu/);
  assert.match(adminLayout, /menuLabel=\{t\("shell\.mobileMenu"\)\}/);
  assert.match(adminLayout, /navLinks=\{adminLinks\}/);

  assert.match(employeeLayout, /SaasMobileMenu/);
  assert.match(employeeLayout, /menuLabel=\{t\("shell\.mobileMenu"\)\}/);
  assert.match(employeeLayout, /href: "\/employee\/guide"/);

  assert.match(mobileMenu, /<details className="saas-mobile-menu">/);
  assert.match(mobileMenu, /className="saas-mobile-nav"/);
  assert.match(mobileMenu, /className="saas-mobile-footer"/);

  assert.match(globalCss, /\.saas-mobile-header\s*\{/);
  assert.match(globalCss, /\.saas-mobile-menu summary\s*\{/);
  assert.match(globalCss, /@media \(max-width: 980px\)\s*\{/);
  assert.match(globalCss, /\.saas-sidebar\s*\{\s*display:\s*none;/);
  assert.match(globalCss, /@media \(max-width: 640px\)\s*\{/);
  assert.match(globalCss, /\.panel-actions \.btn\s*\{/);

  assert.ok(
    countLines(adminLayout) <= 300,
    `admin/layout.tsx should stay under 300 lines (current: ${countLines(adminLayout)})`
  );
  assert.ok(
    countLines(employeeLayout) <= 300,
    `employee/layout.tsx should stay under 300 lines (current: ${countLines(employeeLayout)})`
  );
  assert.ok(
    countLines(mobileMenu) <= 300,
    `SaasMobileMenu.tsx should stay under 300 lines (current: ${countLines(mobileMenu)})`
  );
}

run();
console.log("e2e-wi0239-responsive-mobile-web-ux-baseline.test passed");
