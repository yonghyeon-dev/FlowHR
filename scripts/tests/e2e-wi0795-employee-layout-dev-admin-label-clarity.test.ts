import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0795-employee-layout-dev-admin-label-clarity.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    employeeLayout,
    /footerLinks: SaasMobileMenuLink\[] = showDevTools/,
    "employee layout mobile footer admin link should remain devtools-gated"
  );
  assert.match(
    employeeLayout,
    /\{showDevTools \? <Link href="\/admin">\{t\("employee\.nav\.admin"\)\}<\/Link> : null\}/,
    "employee layout sidebar admin link should remain devtools-gated"
  );
  assert.match(
    messages,
    /"employee\.nav\.admin": "\(\uAC1C\uBC1C\) \uAD00\uB9AC\uC790"/,
    "ko locale admin nav label should be explicitly dev-only"
  );
  assert.match(
    messages,
    /"employee\.nav\.admin": "\(dev\) Admin"/,
    "en locale admin nav label should be explicitly dev-only"
  );
  assert.doesNotMatch(
    messages,
    /"employee\.nav\.admin": "\uAD00\uB9AC\uC790"|"employee\.nav\.admin": "Admin"/,
    "employee admin nav label should not use product-mode wording"
  );

  assert.match(workItem, /WI-0795/i);
  assert.match(workItem, /employee|layout|admin|devtools|label/i);
  assert.match(roadmap, /WI-0795/i);
}

run();
console.log("e2e-wi0795-employee-layout-dev-admin-label-clarity.test passed");
