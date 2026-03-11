import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const shortcutsPanel = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );
  const overviewPanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAccountOverviewPanels.tsx"
  );
  const workspaceHubs = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "workspace-hubs.ts"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1162-employee-home-guide-visual-density-tidy.md"
  );

  assert.match(shortcutsPanel, /employee-home-shortcuts-panel/);
  assert.match(shortcutsPanel, /employee-home-shortcuts-grid/);
  assert.match(shortcutsPanel, /href="\/employee\/guide"/);
  assert.doesNotMatch(shortcutsPanel, /href="\/admin\/approval-executions"/);

  assert.match(overviewPanels, /employee-home-workspace-primary/);
  assert.match(overviewPanels, /employee-home-workspace-secondary/);
  assert.match(overviewPanels, /employee-home-priority-badge-strip/);
  assert.match(overviewPanels, /slice\(0, 3\)/);

  assert.match(workspaceHubs, /primaryLink/);
  assert.match(workspaceHubs, /secondaryLinks/);

  assert.match(globalsCss, /\.employee-home-shortcuts-panel \{/);
  assert.match(globalsCss, /\.employee-home-workspace-primary \{/);
  assert.match(globalsCss, /\.employee-home-workspace-secondary \{/);
  assert.match(globalsCss, /\.employee-home-priority-body \{/);

  assert.match(workItem, /WI-1162/);
  assert.match(workItem, /employee-only launcher/i);
}

run()
  .then(() => {
    console.log("e2e-wi1162-employee-home-guide-visual-density-tidy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
