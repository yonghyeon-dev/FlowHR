import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const scheduleBoard = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
  const scheduleBoardView = readUtf8(
    "src",
    "components",
    "scheduling",
    "EmployeeScheduleBoardView.tsx"
  );
  const scheduleCopy = readUtf8("src", "components", "scheduling", "copy.ts");
  const workItem = readUtf8("work-items", "WI-0437-employee-schedule-search-filter.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(scheduleBoard, /const \[searchQuery, setSearchQuery\] = useState\(""\);/);
  assert.match(scheduleBoard, /const normalizedSearchQuery = searchQuery\.trim\(\)\.toLowerCase\(\);/);
  assert.match(scheduleBoard, /const searchable = `\$\{row\.schedule\.id\} \$\{row\.schedule\.notes \?\? ""\}`\.toLowerCase\(\);/);
  assert.match(scheduleBoard, /onSearchQueryChange={setSearchQuery}/);
  assert.match(scheduleBoard, /onClearSearch={clearSearch}/);

  assert.match(scheduleBoardView, /searchQuery: string;/);
  assert.match(scheduleBoardView, /visibleScheduleCount: number;/);
  assert.match(scheduleBoardView, /onSearchQueryChange: \(value: string\) => void;/);
  assert.match(scheduleBoardView, /onClearSearch: \(\) => void;/);
  assert.match(scheduleBoardView, /copy\.searchLabel/);
  assert.match(scheduleBoardView, /copy\.searchPlaceholder/);
  assert.match(scheduleBoardView, /copy\.clearSearchAction/);
  assert.match(scheduleBoardView, /copy\.visibleCountLabel/);

  assert.match(scheduleCopy, /searchLabel: string;/);
  assert.match(scheduleCopy, /searchPlaceholder: string;/);
  assert.match(scheduleCopy, /clearSearchAction: string;/);
  assert.match(scheduleCopy, /visibleCountLabel: string;/);
  assert.match(scheduleCopy, /searchLabel: "Schedule search"/);
  assert.match(scheduleCopy, /searchPlaceholder: "Search by schedule ID\/notes"/);

  assert.match(workItem, /WI-0437/i);
  assert.match(workItem, /schedule|search|filter|employee|journey/i);
  assert.match(roadmap, /WI-0437/i);
}

run()
  .then(() => {
    console.log("e2e-wi0437-employee-schedule-search-filter.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
