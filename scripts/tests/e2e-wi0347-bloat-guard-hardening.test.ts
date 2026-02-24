import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(text: string) {
  return text.split(/\r?\n/).length;
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminContractsWorkspace = readUtf8(
    "src",
    "components",
    "contracts",
    "AdminContractsWorkspace.tsx"
  );
  const employeeContractsInbox = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInbox.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0347-bloat-guard-hardening.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(adminContractsWorkspace) <= 300, "AdminContractsWorkspace must stay <= 300 lines");
  assert.ok(countLines(employeeContractsInbox) <= 300, "EmployeeContractsInbox must stay <= 300 lines");

  const forbiddenPresetStackPattern =
    /follow-up-recommendation-upgrade|execution-summary-digest|backlog-digest|preset import\/export/i;
  assert.doesNotMatch(employeePage, forbiddenPresetStackPattern);
  assert.doesNotMatch(adminPage, forbiddenPresetStackPattern);

  assert.match(workItem, /WI-0347/i);
  assert.match(workItem, /guard/i);
  assert.match(roadmap, /WI-0347/i);
}

run()
  .then(() => {
    console.log("e2e-wi0347-bloat-guard-hardening.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
