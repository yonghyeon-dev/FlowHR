import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const peoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const peopleView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const readinessPanel = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingReadinessPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0867-admin-people-deeplink-focus-hydration.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(peoplePage, /useSearchParams/);
  assert.match(peoplePage, /normalizeAdminPeopleFocusPanel/);
  assert.match(peoplePage, /normalized === "invites"/);
  assert.match(peoplePage, /normalizeAdminPeopleSourceContext/);
  assert.match(peoplePage, /normalizeActiveFilter/);
  assert.match(peoplePage, /normalizeUpdatedWindow/);
  assert.match(peoplePage, /normalizeHistoryLimit/);
  assert.match(peoplePage, /searchParams\.get\("panel"\)/);
  assert.match(peoplePage, /searchParams\.get\("source"\)/);
  assert.match(peoplePage, /searchParams\.get\("departmentId"\)/);
  assert.match(peoplePage, /searchParams\.get\("positionId"\)/);
  assert.match(peoplePage, /searchParams\.get\("employeeId"\)/);
  assert.match(peoplePage, /scrollIntoView\(\{ behavior: "smooth", block: "start" \}\)/);
  assert.match(peoplePage, /sourceContext=\{sourceContext\}/);
  assert.match(peoplePage, /focusPanel=\{focusPanel\}/);

  assert.match(peopleView, /sourceContextLabel/);
  assert.match(peopleView, /focusPanelLabel/);
  assert.match(peopleView, /Jump to focused section/);
  assert.match(peopleView, /집중 섹션으로 이동/);
  assert.match(peopleView, /panel-focus-target/);
  assert.match(peopleView, /document\.getElementById\(focusPanel\)\?\.scrollIntoView/);

  assert.match(globalsCss, /\.panel-focus-target \.panel/);
  assert.match(readinessPanel, /invites:\s*"\/admin\/people\?panel=invites"/);

  assert.match(workItem, /WI-0867/i);
  assert.match(workItem, /admin|people|deeplink|focus|hydration/i);
  assert.match(roadmap, /WI-0867/i);
}

run();
console.log("e2e-wi0867-admin-people-deeplink-focus-hydration.test passed");
