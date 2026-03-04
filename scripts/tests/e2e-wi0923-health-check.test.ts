import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";

function routeFilePath() {
  return join(process.cwd(), "src", "app", "api", "health", "route.ts");
}

async function run() {
  assert.equal(existsSync(routeFilePath()), true, "health route file should exist");

  const route = await import("../../src/app/api/health/route.ts");
  assert.equal(typeof route.GET, "function", "health GET handler should exist");

  const response = await route.GET();
  assert.equal(response.status, 200, "health GET should return 200");

  const body = (await response.json()) as {
    status: string;
    timestamp?: string;
    version?: string;
    environment?: string;
  };

  assert.equal(body.status, "ok", "health status should be ok");
  assert.equal(typeof body.timestamp, "string", "health response should include timestamp");
  assert.match(body.timestamp ?? "", /^\d{4}-\d{2}-\d{2}T/, "timestamp should be ISO string");
}

run()
  .then(() => {
    console.log("e2e-wi0923-health-check.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
