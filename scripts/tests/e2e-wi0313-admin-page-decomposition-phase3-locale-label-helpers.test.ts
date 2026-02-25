import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPageState = readUtf8("src", "app", "admin", "page-state.ts");
  const localeHelpers = readUtf8("src", "app", "admin", "page-locale-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0313-admin-page-decomposition-phase3-locale-label-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /from "@\/app\/admin\/page-locale-helpers"/);
  assert.match(adminPage, /const localeLabelBundle = useMemo\(\(\) => resolveAdminLocaleLabelBundle\(isKoLocale\), \[isKoLocale\]\);/);
  assert.match(adminPageState, /isDefaultDemoOrganizationName\(previous\)/);

  assert.doesNotMatch(adminPage, /const queueLabels = useMemo\(/);
  assert.doesNotMatch(adminPage, /const inviteRoleLabels = useMemo\(/);
  assert.doesNotMatch(adminPage, /const updatedAtLabel = isKoLocale \? "업데이트" : "Updated";/);

  assert.match(localeHelpers, /export function isDefaultDemoOrganizationName\(/);
  assert.match(localeHelpers, /export function resolveAdminLocaleLabelBundle\(/);

  const adminPageLineCount = adminPage.split(/\r?\n/).length;
  assert.ok(
    adminPageLineCount < 1474,
    `expected admin page line count to decrease below 1474, got ${adminPageLineCount}`
  );

  assert.match(workItem, /WI-0313/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0313/i);
}

run()
  .then(() => {
    console.log("e2e-wi0313-admin-page-decomposition-phase3-locale-label-helpers.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
