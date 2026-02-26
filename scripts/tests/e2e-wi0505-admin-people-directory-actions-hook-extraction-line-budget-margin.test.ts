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
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const directoryActions = readUtf8("src", "app", "admin", "people", "page-directory-actions.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0505-admin-people-directory-actions-hook-extraction-line-budget-margin.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(peoplePage) <= 420,
    `admin/people/page.tsx should stay <= 420 lines (current: ${countLines(peoplePage)})`
  );
  assert.ok(
    countLines(directoryActions) <= 280,
    `admin/people/page-directory-actions.ts should stay <= 280 lines (current: ${countLines(directoryActions)})`
  );

  assert.match(peoplePage, /from "@\/app\/admin\/people\/page-directory-actions"/);
  assert.match(peoplePage, /useAdminPeopleDirectoryActions\(/);
  assert.doesNotMatch(peoplePage, /async function callApi\(/);

  assert.match(directoryActions, /const callApi = useCallback\(/);
  assert.match(directoryActions, /isKoLocale \? "조직 목록 조회" : "Load organizations"/);
  assert.match(directoryActions, /export function useAdminPeopleDirectoryActions\(/);

  assert.match(workItem, /WI-0505/i);
  assert.match(workItem, /admin|people|directory|actions|hook|line budget/i);
  assert.match(roadmap, /WI-0505/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0505-admin-people-directory-actions-hook-extraction-line-budget-margin.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
