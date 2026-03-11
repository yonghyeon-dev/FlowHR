import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "src/components/admin-dashboard/AdminSchedulingPanel.tsx"),
  "utf8"
);

assert.match(
  source,
  /ADMIN_SCHEDULING_PANEL_RETIRED_WI_1137/,
  "admin scheduling panel legacy fragment should be retired after the route-first hub cleanup"
);

console.log("e2e-wi1076-admin-scheduling-surface-humanization.test passed");
