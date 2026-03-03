import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const inbox = readUtf8(
    "src",
    "components",
    "contracts",
    "EmployeeContractsInbox.tsx"
  );
  const helpers = readUtf8(
    "src",
    "components",
    "contracts",
    "employee-inbox-filter-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0834-employee-contracts-deeplink-filter-hydration.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(inbox) <= 340,
    `EmployeeContractsInbox.tsx should stay <= 340 lines (current: ${countLines(inbox)})`
  );

  assert.match(inbox, /import \{ useSearchParams \} from "next\/navigation"/);
  assert.match(inbox, /const searchParams = useSearchParams\(\);/);
  assert.match(inbox, /parseEmployeeContractsSearchQuery\(searchParams\.get\("q"\)\)/);
  assert.match(inbox, /normalizeEmployeeInboxStatusFilter\(searchParams\.get\("status"\)\)/);
  assert.match(
    inbox,
    /normalizeEmployeeInboxDeadlineFilter\(searchParams\.get\("deadline"\)\)/
  );

  assert.match(helpers, /export function parseEmployeeContractsSearchQuery/);
  assert.match(helpers, /export function normalizeEmployeeInboxStatusFilter/);
  assert.match(helpers, /export function normalizeEmployeeInboxDeadlineFilter/);

  assert.match(workItem, /WI-0834/i);
  assert.match(workItem, /employee|contracts|deeplink|filter|hydration/i);
  assert.match(roadmap, /WI-0834/i);
}

run()
  .then(() => {
    console.log("e2e-wi0834-employee-contracts-deeplink-filter-hydration.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
