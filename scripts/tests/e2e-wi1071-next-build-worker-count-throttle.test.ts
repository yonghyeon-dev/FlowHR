import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfig = readFileSync("next.config.ts", "utf8");

assert.match(
  nextConfig,
  /cpus:\s*1/,
  "next build should throttle build cpus to reduce worker fan-out on low-memory deploy containers"
);

assert.match(
  nextConfig,
  /memoryBasedWorkersCount:\s*true/,
  "next build should derive worker count from available memory"
);

console.log("ok - WI-1071 next build worker count throttle guard");
