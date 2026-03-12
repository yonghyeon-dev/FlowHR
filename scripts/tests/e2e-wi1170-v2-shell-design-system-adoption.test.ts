import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const rootLayout = readUtf8("src", "app", "layout.tsx");
  const landingPage = readUtf8("src", "app", "page.tsx");
  const loginPage = readUtf8("src", "app", "login", "page.tsx");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const dashboardChrome = readUtf8("src", "components", "employee-dashboard", "EmployeeDashboardChrome.tsx");
  const bridgeCss = readUtf8("src", "app", "v2-bridge.css");
  const designSystem = readUtf8("src", "app", "v2-design-system.css");
  const workItem = readUtf8("work-items", "WI-1170-v2-shell-design-system-adoption.md");

  assert.match(rootLayout, /import "\.\/v2-design-system\.css";/);
  assert.match(rootLayout, /import "\.\/v2-bridge\.css";/);

  assert.match(landingPage, /className="landing"/);
  assert.match(landingPage, /className="landing-nav"/);
  assert.match(landingPage, /className="landing-features"/);

  assert.match(loginPage, /className="login-page"/);
  assert.match(loginPage, /className="login-shell"/);
  assert.match(loginPage, /className="login-brand-panel"/);

  assert.match(adminLayout, /className="app-shell"/);
  assert.match(adminLayout, /className="app-header"/);
  assert.match(adminLayout, /className="app-sidebar"/);

  assert.match(employeeLayout, /className="app-shell"/);
  assert.match(employeeLayout, /className="app-header"/);
  assert.match(employeeLayout, /className="app-sidebar"/);

  assert.match(dashboardChrome, /className="hero-inline-meta"/);
  assert.match(dashboardChrome, /className="content-grid cols-2-1 mb-6"/);

  assert.match(bridgeCss, /\.landing-nav \{/);
  assert.match(bridgeCss, /\.login-shell \{/);
  assert.match(bridgeCss, /\.app-main-scroll \{/);

  assert.match(designSystem, /\.app-shell \{/);
  assert.match(designSystem, /\.app-header \{/);
  assert.match(designSystem, /\.app-sidebar \{/);

  assert.match(workItem, /WI-1170/);
  assert.match(workItem, /V2/);
}

run()
  .then(() => {
    console.log("e2e-wi1170-v2-shell-design-system-adoption.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
