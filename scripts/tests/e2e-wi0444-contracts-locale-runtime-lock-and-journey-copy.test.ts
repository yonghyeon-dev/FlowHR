import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const journeyPanel = readUtf8("src", "components", "contracts", "EmployeeContractJourneyPanel.tsx");
  const journeyCopy = readUtf8("src", "components", "contracts", "journey-copy.ts");
  const httpSource = readUtf8("src", "components", "contracts", "http.ts");
  const adminWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const templateBuilder = readUtf8("src", "components", "contracts", "ContractTemplateBuilder.tsx");
  const employeeInbox = readUtf8("src", "components", "contracts", "EmployeeContractsInbox.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0444-contracts-journey-copy-extraction-and-runtime-locale-lock.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(journeyPanel, /contractJourneyCopyByLocale/);
  assert.match(journeyPanel, /copy\.timelineTitle/);
  assert.match(journeyPanel, /copy\.recoveryTitle/);

  assert.match(journeyCopy, /export const contractJourneyCopyByLocale/);
  assert.match(journeyCopy, /ko:\s*\{/);
  assert.match(journeyCopy, /en:\s*\{/);

  assert.match(httpSource, /let contractsLocaleOverride: FlowLocale \| null = null;/);
  assert.match(httpSource, /export function setContractsRuntimeLocale\(locale: FlowLocale \| null\)/);
  assert.match(httpSource, /if \(contractsLocaleOverride\) \{\s*return contractsLocaleOverride === "ko";/);

  assert.match(adminWorkspace, /setContractsRuntimeLocale\(locale\)/);
  assert.match(templateBuilder, /setContractsRuntimeLocale\(locale\)/);
  assert.match(employeeInbox, /setContractsRuntimeLocale\(locale\)/);

  assert.match(workItem, /WI-0444/i);
  assert.match(workItem, /contracts|journey|locale|runtime/i);
  assert.match(roadmap, /WI-0444/i);
}

run()
  .then(() => {
    console.log("e2e-wi0444-contracts-locale-runtime-lock-and-journey-copy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
