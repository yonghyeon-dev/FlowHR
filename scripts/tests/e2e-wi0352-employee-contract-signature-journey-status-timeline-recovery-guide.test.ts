import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeContractsInbox = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInbox.tsx"
  );
  const employeeContractsResponsePanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsResponsePanel.tsx"
  );
  const journeyPanel = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractJourneyPanel.tsx"
  );
  const journeyCopy = readUtf8("src", "components", "contracts", "journey-copy.ts");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-0352-employee-contract-signature-journey-status-timeline-recovery-guide.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeContractsInbox, /EmployeeContractsResponsePanel/);
  assert.match(employeeContractsResponsePanel, /EmployeeContractJourneyPanel/);
  assert.match(journeyPanel, /contractJourneyCopyByLocale/);
  assert.match(journeyCopy, /Signature journey timeline/);
  assert.match(journeyCopy, /Recovery guide/);
  assert.match(journeyPanel, /contractJourneySteps/);
  assert.match(globalsCss, /\.contract-journey-panel/);
  assert.match(globalsCss, /\.contract-recovery-guide/);

  assert.match(workItem, /WI-0352/i);
  assert.match(workItem, /journey/i);
  assert.match(roadmap, /WI-0352/i);
}

run()
  .then(() => {
    console.log("e2e-wi0352-employee-contract-signature-journey-status-timeline-recovery-guide.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
