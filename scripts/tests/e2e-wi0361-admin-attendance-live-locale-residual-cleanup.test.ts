import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const copySource = readUtf8("src", "components", "admin-attendance-live", "copy.ts");
  const sectionsSource = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveSections.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0361-admin-attendance-live-locale-residual-cleanup.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(copySource, /tableHeaders: \{/);
  assert.match(copySource, /logSuccessLabel: string;/);
  assert.match(copySource, /logFailLabel: string;/);
  assert.match(copySource, /organizationIdLabel: "조직 ID"/);
  assert.match(copySource, /accessTokenLabel: "액세스 토큰 \(선택\)"/);

  assert.match(sectionsSource, /copy\.tableHeaders\.employee/);
  assert.match(sectionsSource, /copy\.tableHeaders\.department/);
  assert.match(sectionsSource, /copy\.tableHeaders\.checkIn/);
  assert.match(
    sectionsSource,
    /log\.ok \? copy\.logSuccessLabel : copy\.logFailLabel/
  );
  assert.doesNotMatch(sectionsSource, /<th style=\{CELL_STYLE\}>Employee<\/th>/);
  assert.doesNotMatch(sectionsSource, /log\.ok \? "OK" : "FAIL"/);

  assert.match(workItem, /WI-0361/i);
  assert.match(workItem, /attendance-live/i);
  assert.match(roadmap, /WI-0361/i);
}

run()
  .then(() => {
    console.log("e2e-wi0361-admin-attendance-live-locale-residual-cleanup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
