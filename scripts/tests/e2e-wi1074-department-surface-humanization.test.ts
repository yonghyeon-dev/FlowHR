import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const workspacePath = path.join(
  process.cwd(),
  "src/components/departments/AdminDepartmentManagementWorkspace.tsx"
);

const source = readFileSync(workspacePath, "utf8");

assert.match(
  source,
  /formatEmployeeDisplayName, formatPublicEmployeeNumber/,
  "department workspace should use shared product-language helpers"
);
assert.match(
  source,
  /담당자 정보 확인 필요|Manager details pending/,
  "department workspace should keep a human-readable missing-manager fallback"
);
assert.match(
  source,
  /상위 부서 연결 대기|Parent department pending/,
  "department workspace should keep a human-readable parent fallback"
);
assert.doesNotMatch(
  source,
  /return employeeId;/,
  "department workspace should not expose raw employee ids as fallback labels"
);
assert.doesNotMatch(
  source,
  /\$\{employee\.name\} \(\$\{employee\.id\}\)/,
  "department workspace should not render manager labels as name plus raw internal id"
);
assert.doesNotMatch(
  source,
  /\?\? department\.parentId/,
  "department workspace should not expose raw parent department ids in the table"
);

console.log("e2e-wi1074-department-surface-humanization.test passed");
