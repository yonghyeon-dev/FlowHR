import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

type EnvVariableExpectation = {
  name: string;
  required: boolean;
};

const EXPECTED_ENV_VARIABLES: EnvVariableExpectation[] = [
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true },
  { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", required: true },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true },
  { name: "DATABASE_URL", required: true },
  { name: "DIRECT_URL", required: false },
  { name: "NEXT_PUBLIC_FLOWHR_DEV_TOOLS", required: false }
];

const REQUIRED_DEPLOY_SECTIONS = [
  "Pre-deploy",
  "Supabase setup",
  "Vercel setup",
  "Post-deploy",
  "Rollback procedure"
] as const;

const SECRET_PATTERNS: ReadonlyArray<{ label: string; regex: RegExp }> = [
  { label: "OpenAI key", regex: /sk-(?:live|test|proj)-[A-Za-z0-9_-]{12,}/g },
  { label: "Google API key", regex: /AIza[0-9A-Za-z_-]{35}/g },
  { label: "AWS access key", regex: /AKIA[0-9A-Z]{16}/g },
  { label: "Slack token", regex: /xox[baprs]-[A-Za-z0-9-]{10,}/g },
  { label: "GitHub token", regex: /(?:ghp|github_pat)_[A-Za-z0-9_]{20,}/g }
];

function listFilesRecursive(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root)) {
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

function findClosestComment(lines: string[], startIndex: number): string | null {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const candidate = lines[index]?.trim() ?? "";
    if (candidate.length === 0) {
      continue;
    }
    return candidate.startsWith("#") ? candidate : null;
  }
  return null;
}

async function run() {
  const envExamplePath = join(process.cwd(), ".env.example");
  assert.equal(existsSync(envExamplePath), true, ".env.example should exist");

  const envExampleLines = readFileSync(envExamplePath, "utf8").split(/\r?\n/);
  const envVarLineIndices: number[] = [];

  for (let index = 0; index < envExampleLines.length; index += 1) {
    if (/^[A-Z][A-Z0-9_]*=/.test(envExampleLines[index] ?? "")) {
      envVarLineIndices.push(index);
    }
  }

  for (const lineIndex of envVarLineIndices) {
    const commentLine = findClosestComment(envExampleLines, lineIndex);
    assert.ok(commentLine, `env variable at line ${lineIndex + 1} should have a description comment`);
    assert.ok(
      commentLine!.replace(/^#\s*/, "").trim().length > 0,
      `env variable at line ${lineIndex + 1} should have non-empty comment text`
    );
  }

  for (const expectedVariable of EXPECTED_ENV_VARIABLES) {
    const lineIndex = envExampleLines.findIndex((line) => line.startsWith(`${expectedVariable.name}=`));
    assert.ok(lineIndex >= 0, `${expectedVariable.name} should be documented in .env.example`);

    const commentLine = findClosestComment(envExampleLines, lineIndex);
    assert.ok(commentLine, `${expectedVariable.name} should have a description comment`);

    const description = commentLine!.replace(/^#\s*/, "").trim();
    assert.ok(description.length > 0, `${expectedVariable.name} comment should not be empty`);

    if (expectedVariable.required) {
      assert.match(description, /^Required\b/i, `${expectedVariable.name} should be marked as required`);
    } else {
      assert.match(description, /^Optional\b/i, `${expectedVariable.name} should be marked as optional`);
    }
  }

  const serviceRoleComment = findClosestComment(
    envExampleLines,
    envExampleLines.findIndex((line) => line.startsWith("SUPABASE_SERVICE_ROLE_KEY="))
  );
  assert.match(serviceRoleComment ?? "", /server-only/i, "SUPABASE_SERVICE_ROLE_KEY comment should note server-only");

  const devToolsComment = findClosestComment(
    envExampleLines,
    envExampleLines.findIndex((line) => line.startsWith("NEXT_PUBLIC_FLOWHR_DEV_TOOLS="))
  );
  assert.match(devToolsComment ?? "", /dev/i, "NEXT_PUBLIC_FLOWHR_DEV_TOOLS comment should note dev-only usage");

  const deployChecklistPath = join(process.cwd(), "docs", "deploy-checklist.md");
  assert.equal(existsSync(deployChecklistPath), true, "docs/deploy-checklist.md should exist");

  const deployChecklist = readFileSync(deployChecklistPath, "utf8");
  for (const sectionName of REQUIRED_DEPLOY_SECTIONS) {
    assert.match(
      deployChecklist,
      new RegExp(`^##\\s+${sectionName}$`, "im"),
      `deploy checklist should include \"${sectionName}\" section`
    );
  }

  const srcRoot = join(process.cwd(), "src");
  assert.equal(existsSync(srcRoot), true, "src directory should exist");

  const sourceFiles = listFilesRecursive(srcRoot).filter((filePath) =>
    /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath)
  );

  const secretHits: string[] = [];
  for (const filePath of sourceFiles) {
    const source = readFileSync(filePath, "utf8");
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(source)) {
        secretHits.push(`${relative(process.cwd(), filePath)} (${pattern.label})`);
      }
      pattern.regex.lastIndex = 0;
    }
  }

  assert.deepEqual(secretHits, [], `potential hardcoded secrets found in src/: ${secretHits.join(", ")}`);
}

run()
  .then(() => {
    console.log("e2e-wi0931-env-docs.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
