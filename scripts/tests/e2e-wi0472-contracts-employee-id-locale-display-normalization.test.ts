import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  formatEmployeeIdForLocaleDisplay,
  normalizeEmployeeIdForApi
} from "@/lib/i18n/employee-id-locale";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const contractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0472-contracts-employee-id-locale-display-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.equal(normalizeEmployeeIdForApi("직원-1001", "ko"), "EMP-1001");
  assert.equal(formatEmployeeIdForLocaleDisplay("EMP-1001", "ko"), "직원-1001");
  assert.equal(formatEmployeeIdForLocaleDisplay("직원-1001", "en"), "직원-1001");
  assert.equal(formatEmployeeIdForLocaleDisplay("emp-1001", "en"), "EMP-1001");

  assert.match(contractsWorkspace, /normalizeEmployeeIdForApi/);
  assert.match(contractsWorkspace, /formatEmployeeIdForLocaleDisplay/);
  assert.doesNotMatch(contractsWorkspace, /employeeId:\s*employeeId\.trim\(\)/);
  assert.doesNotMatch(contractsWorkspace, /\{copy\.employeePrefix\}\s+\{document\.employeeId\}/);

  assert.match(workItem, /WI-0472/i);
  assert.match(workItem, /contracts|employee id|locale|display|normalization/i);
  assert.match(roadmap, /WI-0472/i);
}

run()
  .then(() => {
    console.log("e2e-wi0472-contracts-employee-id-locale-display-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
