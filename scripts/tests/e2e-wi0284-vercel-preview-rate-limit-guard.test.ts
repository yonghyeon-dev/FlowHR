import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type VercelConfig = {
  framework?: string;
  git?: {
    deploymentEnabled?: Record<string, unknown>;
  };
};

function run() {
  const source = fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8");
  const parsed = JSON.parse(source) as VercelConfig;

  assert.equal(parsed.framework, "nextjs", "vercel framework should remain nextjs");
  assert.ok(parsed.git?.deploymentEnabled, "vercel git.deploymentEnabled should be configured");
  assert.equal(
    parsed.git?.deploymentEnabled?.main,
    true,
    "vercel main branch deployment should stay enabled"
  );
  assert.equal(
    parsed.git?.deploymentEnabled?.["*"],
    false,
    "vercel non-main branch deployments should be disabled to avoid preview rate-limit noise"
  );
}

run();
console.log("e2e-wi0284-vercel-preview-rate-limit-guard.test passed");
