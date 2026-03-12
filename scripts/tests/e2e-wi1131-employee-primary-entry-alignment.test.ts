import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const guidePage = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const guideDashboard = readUtf8(
    "src",
    "components",
    "employee-guide",
    "EmployeeGuideDashboard.tsx"
  );
  const guideCopy = readUtf8("src", "components", "employee-guide", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-1131-employee-primary-entry-alignment.md"
  );

  assert.match(
    employeeLayout,
    /href: "\/employee\/attendance\/correction"/
  );
  assert.match(
    employeeLayout,
    /href: "\/employee\/leave\/request"/
  );
  assert.match(
    guidePage,
    /EmployeeGuideDashboard/
  );
  assert.match(
    guideCopy,
    /href: "\/employee\/attendance\/correction\?source=employee-guide"/
  );
  assert.match(
    guideCopy,
    /href: "\/employee\/leave\/request\?source=employee-guide"/
  );
  assert.match(guideDashboard, /\/employee\/requests\?source=employee-guide/);
  assert.match(
    guideCopy,
    /\/employee\/attendance\/correction\?source=employee-guide/
  );
  assert.match(
    guideCopy,
    /\/employee\/leave\/request\?source=employee-guide/
  );
  assert.match(workItem, /직원 주작업 진입점 정렬/);
}

run();
console.log("e2e-wi1131-employee-primary-entry-alignment.test passed");
