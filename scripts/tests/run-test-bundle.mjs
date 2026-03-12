import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

import { testBundles } from "./test-bundles.mjs";

const [, , bundleName] = process.argv;

if (!bundleName) {
  console.error("Usage: node scripts/tests/run-test-bundle.mjs <bundle-name>");
  process.exit(1);
}

const bundle = testBundles[bundleName];

if (!bundle) {
  console.error(`Unknown test bundle: ${bundleName}`);
  process.exit(1);
}

const tsxBinary = path.join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx",
);

for (const testFile of bundle) {
  console.log(`\n=== ${bundleName} :: ${testFile} ===`);
  const result =
    process.platform === "win32"
      ? spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `${tsxBinary} ${testFile}`], {
          cwd: process.cwd(),
          env: process.env,
          stdio: "inherit",
        })
      : spawnSync(tsxBinary, [testFile], {
          cwd: process.cwd(),
          env: process.env,
          stdio: "inherit",
        });

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
