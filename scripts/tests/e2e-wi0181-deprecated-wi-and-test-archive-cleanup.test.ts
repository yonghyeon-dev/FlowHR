import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function wiTargets() {
  const targets: number[] = [];
  for (let n = 131; n <= 172; n += 1) {
    if (n === 144) continue;
    targets.push(n);
  }
  return targets;
}

function padWi(n: number) {
  return String(n).padStart(4, "0");
}

function findWorkItemFile(wi: number, files: string[]) {
  const prefix = `WI-${padWi(wi)}-`;
  return files.find((file) => file.startsWith(prefix));
}

function findE2eFile(wi: number, files: string[]) {
  const prefix = `e2e-wi${padWi(wi)}`;
  return files.find((file) => file.startsWith(prefix));
}

function run() {
  const targets = wiTargets();
  assert.equal(targets.length, 41, "WI-0181 target set should contain 41 WI numbers");

  const workItemDir = path.resolve(process.cwd(), "work-items");
  const testDir = path.resolve(process.cwd(), "scripts", "tests");

  const workItemFiles = fs
    .readdirSync(workItemDir)
    .filter((file) => /^WI-\d{4}-.*\.md$/i.test(file));
  const e2eFiles = fs
    .readdirSync(testDir)
    .filter((file) => /^e2e-wi\d{4}.*\.test\.ts$/i.test(file));

  for (const wi of targets) {
    const workItemFile = findWorkItemFile(wi, workItemFiles);
    assert.ok(workItemFile, `missing work-item file for WI-${padWi(wi)}`);
    const workItemText = readUtf8("work-items", workItemFile!);
    assert.equal(
      workItemText.includes("**DEPRECATED**"),
      true,
      `${workItemFile} should include DEPRECATED banner`
    );
    assert.equal(
      workItemText.includes("docs/codex-guide.md Part 1"),
      true,
      `${workItemFile} should include codex-guide Part 1 reference`
    );

    const e2eFile = findE2eFile(wi, e2eFiles);
    assert.ok(e2eFile, `missing e2e archive file for WI-${padWi(wi)}`);
    const e2eText = readUtf8("scripts", "tests", e2eFile!);
    assert.equal(
      e2eText.includes("DEPRECATED"),
      true,
      `${e2eFile} should include DEPRECATED marker`
    );
    assert.equal(
      e2eText.includes("Intentionally no-op"),
      true,
      `${e2eFile} should include no-op placeholder body`
    );
    assert.equal(
      e2eText.includes("deprecated (no-op)"),
      true,
      `${e2eFile} should include archive output message`
    );
  }

  const packageJson = JSON.parse(readUtf8("package.json"));
  const mvp = String(packageJson.scripts?.["test:e2e:mvp"] ?? "");
  const full = String(packageJson.scripts?.["test:e2e:full"] ?? "");

  assert.equal(
    mvp.includes("e2e-wi0181-deprecated-wi-and-test-archive-cleanup.test.ts"),
    true,
    "test:e2e:mvp should include WI-0181 regression"
  );
  assert.equal(
    full.includes("e2e-wi0181-deprecated-wi-and-test-archive-cleanup.test.ts"),
    true,
    "test:e2e:full should include WI-0181 regression"
  );

  for (const wi of targets) {
    const token = `e2e-wi${padWi(wi)}`;
    assert.equal(
      mvp.includes(token),
      false,
      `test:e2e:mvp should not include archived token ${token}`
    );
    assert.equal(
      full.includes(token),
      false,
      `test:e2e:full should not include archived token ${token}`
    );
  }
}

run();
console.log("e2e-wi0181-deprecated-wi-and-test-archive-cleanup.test passed");
