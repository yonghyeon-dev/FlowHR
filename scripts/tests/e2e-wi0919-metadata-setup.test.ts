import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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

function postRequest(payload: Record<string, unknown>) {
  return new Request("http://localhost/api/auth/setup-metadata", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify(payload)
  });
}

async function run() {
  const routePath = filePath("src", "app", "api", "auth", "setup-metadata", "route.ts");
  assert.equal(existsSync(routePath), true, "setup-metadata route file should exist");

  const route = await import("../../src/app/api/auth/setup-metadata/route.ts");
  assert.equal(typeof route.POST, "function", "setup-metadata POST handler should exist");

  const missingRoleResponse = await route.POST(
    postRequest({
      organization_id: "ORG-WI0919-1"
    })
  );
  assert.equal(missingRoleResponse.status, 400, "missing role should return 400");

  const missingOrganizationResponse = await route.POST(
    postRequest({
      role: "admin"
    })
  );
  assert.equal(missingOrganizationResponse.status, 400, "missing organization_id should return 400");
}

run()
  .then(() => {
    console.log("e2e-wi0919-metadata-setup.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
