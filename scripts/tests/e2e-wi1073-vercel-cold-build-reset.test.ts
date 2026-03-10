import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const workflow = readFileSync(".github/workflows/vercel-production-deploy.yml", "utf8");

assert.match(
  workflow,
  /run_vercel deploy --prod --yes --force/,
  "production deploy should force a cold Vercel rebuild when the restored build cache keeps crashing the build"
);

assert.doesNotMatch(
  workflow,
  /run_vercel deploy --prod --yes --with-cache/,
  "production deploy must not retain Vercel build cache when the cache is under investigation for OOM regressions"
);

console.log("ok - WI-1073 vercel cold build reset guard");
