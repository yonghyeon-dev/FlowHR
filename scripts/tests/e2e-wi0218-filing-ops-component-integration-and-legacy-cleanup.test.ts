import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
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

function archivedWiTargets() {
  const targets = [198, 199];
  for (let n = 201; n <= 216; n += 1) {
    targets.push(n);
  }
  return targets;
}

function run() {
  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const messagesSource = readUtf8("src", "lib", "i18n", "messages.ts");
  const opsPageSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "page.tsx"
  );
  const packageJson = JSON.parse(readUtf8("package.json"));
  const mvp = String(packageJson.scripts?.["test:e2e:mvp"] ?? "");
  const full = String(packageJson.scripts?.["test:e2e:full"] ?? "");

  assert.match(
    opsPageSource,
    /redirect\("\/admin\/payroll-year-end-filing\/ops\/alert"\)/,
    "ops root page should redirect to flat alert route"
  );
  assert.equal(
    adminLayoutSource.includes("/admin/payroll-year-end-filing/ops/checklist/review"),
    false,
    "admin layout should not include deep checklist/review route links"
  );
  assert.equal(
    adminLayoutSource.includes("/admin/payroll-year-end-filing/ops/checklist?"),
    false,
    "admin layout should not include legacy checklist query links"
  );
  assert.equal(
    messagesSource.includes("admin.nav.yearEndFilingOpsChecklist"),
    false,
    "messages should not keep legacy deep checklist nav keys"
  );

  const legacyRouteDir = path.resolve(
    process.cwd(),
    "src",
    "app",
    "admin",
    "payroll-year-end-filing",
    "ops",
    "checklist"
  );
  assert.equal(
    fs.existsSync(legacyRouteDir),
    false,
    "legacy deep checklist route tree should be removed"
  );

  const filingComponentDir = path.resolve(
    process.cwd(),
    "src",
    "components",
    "payroll-year-end-filing"
  );
  const componentFiles = fs.readdirSync(filingComponentDir);
  assert.equal(
    componentFiles.some((name) => name.startsWith("PayrollYearEndFilingOps")),
    false,
    "legacy PayrollYearEndFilingOps* components should be removed"
  );
  assert.equal(
    componentFiles.some((name) => name.startsWith("filing-alert-")),
    false,
    "legacy filing-alert-* helpers should be removed"
  );
  assert.equal(
    componentFiles.includes("FilingWorkflow.module.css"),
    true,
    "flat workflow module css should exist"
  );

  const targets = archivedWiTargets();
  const workItemFiles = fs
    .readdirSync(path.resolve(process.cwd(), "work-items"))
    .filter((file) => /^WI-\d{4}-.*\.md$/i.test(file));
  const e2eFiles = fs
    .readdirSync(path.resolve(process.cwd(), "scripts", "tests"))
    .filter((file) => /^e2e-wi\d{4}.*\.test\.ts$/i.test(file));

  for (const wi of targets) {
    const token = `e2e-wi${padWi(wi)}`;
    assert.equal(
      mvp.includes(token),
      false,
      `test:e2e:mvp should exclude archived ${token}`
    );
    assert.equal(
      full.includes(token),
      false,
      `test:e2e:full should exclude archived ${token}`
    );

    const workItemFile = findWorkItemFile(wi, workItemFiles);
    assert.ok(workItemFile, `missing work-item file for WI-${padWi(wi)}`);
    const workItemText = readUtf8("work-items", workItemFile!);
    assert.equal(
      workItemText.includes("**DEPRECATED**"),
      true,
      `${workItemFile} should include DEPRECATED banner`
    );
    assert.equal(
      workItemText.includes("docs/codex-guide.md Part 1.5"),
      true,
      `${workItemFile} should reference codex-guide Part 1.5`
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
      `${e2eFile} should include no-op body`
    );
    assert.equal(
      e2eText.includes("deprecated (no-op)"),
      true,
      `${e2eFile} should include archive output message`
    );
  }

  assert.equal(
    mvp.includes("e2e-wi0218-filing-ops-component-integration-and-legacy-cleanup.test.ts"),
    true,
    "test:e2e:mvp should include WI-0218 regression"
  );
  assert.equal(
    full.includes("e2e-wi0218-filing-ops-component-integration-and-legacy-cleanup.test.ts"),
    true,
    "test:e2e:full should include WI-0218 regression"
  );
}

run();
console.log("e2e-wi0218-filing-ops-component-integration-and-legacy-cleanup.test passed");
