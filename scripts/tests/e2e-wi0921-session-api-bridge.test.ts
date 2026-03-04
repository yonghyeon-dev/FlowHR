import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function listFilesRecursive(root: string): string[] {
  const entries = readdirSync(root);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listFilesRecursive(fullPath));
      continue;
    }
    files.push(fullPath);
  }
  return files;
}

async function run() {
  const appRoot = join(process.cwd(), "src", "app");
  const appFiles = listFilesRecursive(appRoot).filter((filePath) =>
    /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)
  );

  const hardcodedEmployeeIdMatches = appFiles.filter((filePath) =>
    readFileSync(filePath, "utf8").includes("EMP-1001")
  );
  assert.deepEqual(
    hardcodedEmployeeIdMatches,
    [],
    `src/app contains hardcoded EMP-1001 in: ${hardcodedEmployeeIdMatches.join(", ")}`
  );

  const apiClientPath = join(process.cwd(), "src", "lib", "api-client.ts");
  assert.equal(existsSync(apiClientPath), true, "src/lib/api-client.ts should exist");
  const apiClientSource = readUtf8("src", "lib", "api-client.ts");

  assert.match(apiClientSource, /export async function resolveApiActorSession/);
  assert.match(apiClientSource, /export async function resolveActorHeadersFromSupabaseSession/);
  assert.match(apiClientSource, /export async function apiClientFetch/);
}

run()
  .then(() => {
    console.log("e2e-wi0921-session-api-bridge.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
