import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminApiHelpers = readUtf8("src", "app", "admin", "page-api-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0894-admin-root-production-session-gate-alignment.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminPage,
    /const allowHeaderActorFallback = showDevTools \|\| !isProductionRuntime;/
  );
  assert.match(
    adminPage,
    /const requiresLoginSession = isProductionRuntime && !usesBearerToken && !showDevTools;/
  );
  assert.match(adminPage, /allowHeaderActorFallback,/);
  assert.match(
    adminPage,
    /if \(requiresLoginSession\) \{\s*setSummary\(EMPTY_SUMMARY\);\s*setLoadError\(productionSessionRequiredNotice\);/
  );
  assert.match(
    adminPage,
    /disabled=\{isLoading \|\| requiresLoginSession\}/
  );
  assert.match(
    adminPage,
    /\{productionSessionRequiredNotice\} <Link href="\/login">\/login<\/Link>/
  );

  assert.match(adminApiHelpers, /allowHeaderActorFallback: boolean;/);
  assert.match(
    adminApiHelpers,
    /if \(!input\.allowHeaderActorFallback\) \{\s*return headers;\s*\}/
  );

  assert.match(workItem, /WI-0894/i);
  assert.match(workItem, /admin|dashboard|production|session|login|devtools/i);
  assert.match(roadmap, /WI-0894/i);
}

run()
  .then(() => {
    console.log("e2e-wi0894-admin-root-production-session-gate-alignment.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
