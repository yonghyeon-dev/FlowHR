import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

function filePath(...parts: string[]) {
  return join(process.cwd(), ...parts);
}

async function run() {
  const routePath = filePath("src", "app", "api", "auth", "ensure-organization", "route.ts");
  assert.equal(existsSync(routePath), true, "ensure-organization route file should exist");

  const route = await import("../../src/app/api/auth/ensure-organization/route.ts");
  assert.equal(typeof route.POST, "function", "ensure-organization POST handler should exist");

  const unauthenticatedResponse = await route.POST(
    new Request("http://localhost/api/auth/ensure-organization", {
      method: "POST"
    })
  );
  assert.equal(unauthenticatedResponse.status, 401, "missing bearer token should return 401");

  const sessionHookSource = readFileSync(
    filePath("src", "lib", "client", "useSupabaseSession.ts"),
    "utf8"
  );
  assert.equal(
    sessionHookSource.includes('fetch("/api/auth/ensure-organization"'),
    true,
    "session hook should trigger organization ensure route"
  );

  console.log("e2e-wi1026-org-record-auto-ensure.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
