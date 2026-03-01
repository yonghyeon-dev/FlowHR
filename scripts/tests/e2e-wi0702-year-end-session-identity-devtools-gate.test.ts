import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEndConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndConsole.tsx"
  );
  const yearEndPreflightConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndPreflightConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0702-year-end-session-identity-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(yearEndConsole, /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\);/);
  assert.match(yearEndConsole, /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session actor[\s\S]*\) : null\}/);

  assert.match(
    yearEndPreflightConsole,
    /const showDevTools = isTruthyFlag\(process\.env\.NEXT_PUBLIC_FLOWHR_DEV_TOOLS\);/
  );
  assert.match(
    yearEndPreflightConsole,
    /\{showDevTools \? \([\s\S]*Session organization[\s\S]*Session actor[\s\S]*\) : null\}/
  );

  assert.match(workItem, /WI-0702/i);
  assert.match(workItem, /year-end|preflight|session|identity|devtools/i);
  assert.match(roadmap, /WI-0702/i);
}

run()
  .then(() => {
    console.log("e2e-wi0702-year-end-session-identity-devtools-gate.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
