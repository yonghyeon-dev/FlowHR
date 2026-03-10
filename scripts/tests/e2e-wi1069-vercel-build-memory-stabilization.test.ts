import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const nextConfig = readFileSync("next.config.ts", "utf8");
const nextTsconfig = readFileSync("tsconfig.next.json", "utf8");
const baseTsconfig = readFileSync("tsconfig.json", "utf8");

assert.match(
  nextConfig,
  /typescript:\s*\{\s*tsconfigPath:\s*"\.\/tsconfig\.next\.json"/m,
  "next build should use tsconfig.next.json to avoid typechecking non-app assets"
);

assert.match(
  nextConfig,
  /eslint:\s*\{\s*dirs:\s*\["src"\]/m,
  "next build should lint only app source directories"
);

assert.match(
  nextTsconfig,
  /"src\/\*\*\/\*\.ts"/,
  "tsconfig.next.json should include src TypeScript files"
);

assert.doesNotMatch(
  nextTsconfig,
  /"\*\*\/\*\.ts"/,
  "tsconfig.next.json should not glob the entire repository TypeScript files"
);

assert.doesNotMatch(
  nextTsconfig,
  /"\*\*\/\*\.tsx"/,
  "tsconfig.next.json should not glob the entire repository TSX files"
);

assert.match(
  baseTsconfig,
  /"\*\*\/\*\.ts"/,
  "base tsconfig should continue to cover full-repo typecheck"
);

console.log("ok - WI-1069 vercel build memory stabilization guard");
