import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

type VercelConfig = {
  framework?: string;
  git?: {
    deploymentEnabled?: Record<string, unknown>;
  };
  github?: {
    enabled?: boolean;
  };
};

function run() {
  const vercelConfigSource = fs.readFileSync(path.resolve(process.cwd(), "vercel.json"), "utf8");
  const vercelConfig = JSON.parse(vercelConfigSource) as VercelConfig;

  assert.equal(vercelConfig.framework, "nextjs", "vercel framework should remain nextjs");
  assert.equal(
    vercelConfig.git?.deploymentEnabled?.main,
    true,
    "main branch deployment policy should stay enabled"
  );
  assert.equal(
    vercelConfig.git?.deploymentEnabled?.["*"],
    false,
    "non-main branch deployment policy should stay disabled"
  );
  assert.equal(
    vercelConfig.github?.enabled,
    false,
    "Vercel GitHub integration should stay disabled to avoid preview PR deployment noise"
  );

  const workflowPath = path.resolve(
    process.cwd(),
    ".github/workflows/vercel-production-deploy.yml"
  );
  assert.ok(fs.existsSync(workflowPath), "mainline Vercel production deploy workflow must exist");

  const workflowSource = fs.readFileSync(workflowPath, "utf8");
  assert.match(
    workflowSource,
    /name:\s*vercel-production-deploy/,
    "workflow name should match vercel-production-deploy"
  );
  assert.match(
    workflowSource,
    /push:\s*\n\s*branches:\s*\n\s*-\s*main/m,
    "workflow should trigger on push to main"
  );
  assert.match(
    workflowSource,
    /workflow_dispatch:/,
    "workflow should allow manual dispatch fallback"
  );
  assert.match(
    workflowSource,
    /environment:\s*production/,
    "workflow should use production environment secrets"
  );
  assert.match(
    workflowSource,
    /npx vercel@latest deploy --prod --yes/,
    "workflow should execute a production Vercel deploy command"
  );
}

run();
console.log("e2e-wi0390-vercel-main-deploy-workflow.test passed");
