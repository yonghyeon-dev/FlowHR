import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeeWorkspace = readUtf8("src", "components", "benefits", "EmployeeBenefitsWorkspace.tsx");
  const benefitsCopy = readUtf8("src", "components", "benefits", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0435-employee-benefits-request-search-filter.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeeWorkspace, /const \[requestSearchQuery, setRequestSearchQuery\] = useState\(""\);/);
  assert.match(employeeWorkspace, /const filteredRequests = useMemo\(\(\) => \{/);
  assert.match(employeeWorkspace, /catalogById\.get\(item\.benefitId\)\?\.name \?\? ""/);
  assert.match(employeeWorkspace, /item\.reason\.toLowerCase\(\)/);
  assert.match(employeeWorkspace, /copy\.requestSearchLabel/);
  assert.match(employeeWorkspace, /copy\.requestSearchPlaceholder/);
  assert.match(employeeWorkspace, /copy\.clearSearchAction/);
  assert.match(employeeWorkspace, /copy\.filteredRequestSummaryLabel/);
  assert.match(employeeWorkspace, /copy\.filteredEmptyRequests/);
  assert.match(employeeWorkspace, /filteredRequests\.map\(\(item\) => \{/);

  assert.match(benefitsCopy, /requestSearchLabel: string;/);
  assert.match(benefitsCopy, /requestSearchPlaceholder: string;/);
  assert.match(benefitsCopy, /clearSearchAction: string;/);
  assert.match(benefitsCopy, /filteredRequestSummaryLabel: string;/);
  assert.match(benefitsCopy, /filteredEmptyRequests: string;/);
  assert.match(benefitsCopy, /requestSearchLabel: "요청 검색"/);
  assert.match(benefitsCopy, /requestSearchLabel: "Request search"/);

  assert.match(workItem, /WI-0435/i);
  assert.match(workItem, /benefits|request|search|filter|employee/i);
  assert.match(roadmap, /WI-0435/i);
}

run()
  .then(() => {
    console.log("e2e-wi0435-employee-benefits-request-search-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
