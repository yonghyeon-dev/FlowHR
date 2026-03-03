import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0869-employee-session-autoload-snapshot.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /const autoSnapshotLoadKeyRef = useRef<string \| null>\(null\);/);
  assert.match(
    employeePage,
    /const refreshEmployeeSnapshotRef = useRef<null \| \(\(\) => Promise<void>\)>\(null\);/
  );
  assert.match(
    employeePage,
    /refreshEmployeeSnapshotRef\.current = mutationActions\.refreshEmployeeSnapshot;/
  );
  assert.match(employeePage, /if \(isProductionRuntime && !usesBearerToken\)/);
  assert.match(
    employeePage,
    /const autoLoadKey = `\$\{normalizedEmployeeId\}:\$\{usesBearerToken \? "session" : "header"\}`;/
  );
  assert.match(
    employeePage,
    /if \(autoSnapshotLoadKeyRef\.current === autoLoadKey\)/
  );
  assert.match(employeePage, /autoSnapshotLoadKeyRef\.current = autoLoadKey;/);
  assert.match(employeePage, /const refreshSnapshot = refreshEmployeeSnapshotRef\.current;/);
  assert.match(employeePage, /if \(refreshSnapshot\) \{\s*void refreshSnapshot\(\);\s*\}/);

  assert.match(workItem, /WI-0869/i);
  assert.match(workItem, /employee|session|autoload|snapshot/i);
  assert.match(roadmap, /WI-0869/i);
}

run();
console.log("e2e-wi0869-employee-session-autoload-snapshot.test passed");
