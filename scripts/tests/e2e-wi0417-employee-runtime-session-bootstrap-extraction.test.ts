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
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const sessionHelpers = readUtf8("src", "app", "employee", "page-session-helpers.ts");

  const workItem = readUtf8("work-items", "WI-0417-employee-runtime-session-bootstrap-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-session-helpers";/);
  assert.match(employeePage, /const \{[\s\S]*\} = useEmployeeRuntimeSession\(\{/);
  assert.match(employeePage, /const supabaseUrl = process\.env\.NEXT_PUBLIC_SUPABASE_URL \?\? notConfiguredLabel;/);
  assert.doesNotMatch(employeePage, /const \{ snapshot: supabaseSession, error: supabaseSessionError \} = useSupabaseSession\(\);/);

  assert.match(sessionHelpers, /export function useEmployeeRuntimeSession\(/);
  assert.match(sessionHelpers, /const \{ snapshot: supabaseSession, error: supabaseSessionError \} = useSupabaseSession\(\);/);
  assert.match(sessionHelpers, /setOrganizationId\(orgId\.trim\(\)\);/);
  assert.match(sessionHelpers, /setEmployeeId\(actorId\);/);

  assert.ok(countLines(employeePage) <= 970, `employee/page.tsx must stay <= 970 lines after WI-0417 (current: ${countLines(employeePage)})`);

  assert.match(workItem, /WI-0417/i);
  assert.match(workItem, /employee|runtime session|bootstrap|decomposition/i);
  assert.match(roadmap, /WI-0417/i);
}

run()
  .then(() => {
    console.log("e2e-wi0417-employee-runtime-session-bootstrap-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

