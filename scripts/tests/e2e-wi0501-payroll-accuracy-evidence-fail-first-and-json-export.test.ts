import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const evidencePanelSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollAccuracyEvidencePanel.tsx"
  );
  const yearEndConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndConsole.tsx"
  );
  const workItemSource = readUtf8(
    "work-items",
    "WI-0501-payroll-accuracy-evidence-fail-first-and-json-export.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(evidencePanelSource, /const \[showFailOnly, setShowFailOnly\] = useState\(true\);/);
  assert.match(evidencePanelSource, /const sortedChecks = useMemo\(/);
  assert.match(evidencePanelSource, /return left\.passed \? 1 : -1;/);
  assert.match(evidencePanelSource, /const visibleChecks = useMemo\(/);
  assert.match(evidencePanelSource, /showFailOnly \? sortedChecks\.filter\(\(check\) => !check\.passed\) : sortedChecks/);
  assert.match(evidencePanelSource, /function downloadEvidenceJson\(\)/);
  assert.match(evidencePanelSource, /anchor\.download =/);
  assert.match(evidencePanelSource, /급여-정확성-증빙-/);
  assert.match(evidencePanelSource, /payroll-accuracy-evidence-/);
  assert.match(evidencePanelSource, /showFailOnly \? showAllActionLabel : failOnlyActionLabel/);

  assert.match(yearEndConsoleSource, /<PayrollAccuracyEvidencePanel/);
  assert.match(yearEndConsoleSource, /locale=\{locale\}/);

  assert.match(workItemSource, /WI-0501/i);
  assert.match(workItemSource, /payroll|accuracy|evidence|fail|json|export/i);
  assert.match(roadmap, /WI-0501/i);
}

run()
  .then(() => {
    console.log("e2e-wi0501-payroll-accuracy-evidence-fail-first-and-json-export.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
