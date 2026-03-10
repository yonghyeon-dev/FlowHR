import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const source = readFileSync(
  path.join(process.cwd(), "src/app/admin/people/page-view-org-chart-panel.tsx"),
  "utf8"
);

assert.match(
  source,
  /formatEmployeeDisplayName[\s\S]*formatEmployeeStatusLabel[\s\S]*formatPublicEmployeeNumber/,
  "org chart panel should use shared product-language helpers for employee display"
);
assert.match(
  source,
  /사번|Employee/,
  "org chart panel should expose a public employee number label"
);
assert.doesNotMatch(
  source,
  /employee\.name \?\? employee\.id/,
  "org chart panel should not fall back to raw employee ids in the pill title"
);
assert.doesNotMatch(
  source,
  /employee\.id} \/ \{resolveEmployeeActiveLabel/,
  "org chart panel should not print raw employee ids in the pill metadata"
);

console.log("e2e-wi1075-admin-org-chart-surface-humanization.test passed");
