import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfig = readFileSync("next.config.ts", "utf8");

assert.match(
  nextConfig,
  /webpackBuildWorker:\s*true/,
  "next build should force webpackBuildWorker for lower-memory production builds"
);

assert.match(
  nextConfig,
  /webpackMemoryOptimizations:\s*true/,
  "next build should enable webpack memory optimizations"
);

assert.match(
  nextConfig,
  /parallelServerCompiles:\s*false/,
  "next build should avoid parallel server compiles when reducing memory pressure"
);

assert.match(
  nextConfig,
  /parallelServerBuildTraces:\s*false/,
  "next build should avoid parallel server build traces when reducing memory pressure"
);

console.log("ok - WI-1070 next build worker memory optimization guard");
