import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const source = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "EmployeeYearEndInputConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0365-employee-year-end-input-ux-accuracy-guidance-improvements.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(source, /accuracyGuideTitle/);
  assert.match(source, /accuracyGuidanceItems = useMemo/);
  assert.match(source, /copy\.validationTitle/);
  assert.match(source, /copy\.validationChecklistAriaLabel/);
  assert.match(source, /formatKrw\(simulation\.annualGrossPayKrw, runtimeLocale\)/);
  assert.match(source, /copy\.accuracyGuideNoSimulation/);
  assert.match(source, /copy\.accuracyGuideNoWarnings/);
  assert.match(source, /copy\.coreLoadInvalidGuide/);

  assert.match(workItem, /WI-0365/i);
  assert.match(workItem, /year-end-input/i);
  assert.match(roadmap, /WI-0365/i);
}

run()
  .then(() => {
    console.log("e2e-wi0365-employee-year-end-input-ux-accuracy-guidance-improvements.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
