import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const previewPanel = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx"
  );
  const previewPage = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page.tsx"
  );
  const previewPageClient = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-client.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-1132-admin-payroll-preview-workspace-route.md"
  );

  assert.match(
    previewPanel,
    /return `\/admin\/payroll-close\/preview-builder\?\$\{search\.toString\(\)\}`;/
  );
  assert.match(previewPanel, /search\.set\("source", "payroll-preview-share"\)/);
  assert.match(previewPage, /AdminPayrollPreviewBuilderPageClient/);
  assert.match(previewPageClient, /useAdminDashboardState/);
  assert.match(previewPageClient, /buildAdminDashboardActions/);
  assert.match(previewPageClient, /<AdminPayrollPanel/);
  assert.match(workItem, /\/admin\/payroll-close\/preview-builder/);
}

run()
  .then(() => {
    console.log("e2e-wi1132-admin-payroll-preview-workspace-route.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
