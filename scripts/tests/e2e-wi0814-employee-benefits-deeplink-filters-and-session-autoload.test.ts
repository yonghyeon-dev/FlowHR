import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const workspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const helpers = readUtf8("src", "components", "benefits", "employee-benefits-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0814-employee-benefits-deeplink-filters-and-session-autoload.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(workspace) <= 300,
    `EmployeeBenefitsWorkspace.tsx should stay <= 300 lines (current: ${countLines(workspace)})`
  );

  assert.match(workspace, /import \{ useSearchParams \} from "next\/navigation";/);
  assert.match(workspace, /normalizeEmployeeBenefitRequestStatusFilter\(searchParams\.get\("status"\)\)/);
  assert.match(workspace, /normalizeEmployeeBenefitRiskFilter\(searchParams\.get\("risk"\)\)/);
  assert.match(workspace, /parseEmployeeBenefitSearchQuery\(searchParams\.get\("q"\)\)/);
  assert.match(workspace, /const \[autoLoadAttempted, setAutoLoadAttempted\] = useState\(false\);/);
  assert.match(workspace, /void loadWorkspace\(\);/);

  assert.match(helpers, /export function normalizeEmployeeBenefitRequestStatusFilter\(/);
  assert.match(helpers, /export function normalizeEmployeeBenefitRiskFilter\(/);
  assert.match(helpers, /export function parseEmployeeBenefitSearchQuery\(/);

  assert.match(workItem, /WI-0814/i);
  assert.match(workItem, /employee|benefits|deeplink|autoload|filter/i);
  assert.match(roadmap, /WI-0814/i);
}

run();
console.log("e2e-wi0814-employee-benefits-deeplink-filters-and-session-autoload.test passed");
