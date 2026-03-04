import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

type CheckResult = {
  name: string;
  ok: boolean;
  details: string;
};

type CommandResult = {
  status: number | null;
  stdout: string;
  stderr: string;
  error: string | null;
};

function runCommand(command: string, env?: NodeJS.ProcessEnv): CommandResult {
  const result = spawnSync(command, {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    shell: true
  });

  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error ? result.error.message : null
  };
}

function parseDotEnv(content: string): Record<string, string> {
  const parsed: Record<string, string> = {};
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) {
      continue;
    }

    const key = match[1];
    let value = match[2] ?? "";

    const quotedWithSingle = value.startsWith("'") && value.endsWith("'");
    const quotedWithDouble = value.startsWith('"') && value.endsWith('"');
    if (quotedWithSingle || quotedWithDouble) {
      value = value.slice(1, -1);
    } else {
      const hashIndex = value.indexOf("#");
      if (hashIndex >= 0) {
        value = value.slice(0, hashIndex);
      }
      value = value.trim();
    }

    parsed[key] = value;
  }

  return parsed;
}

function loadLocalEnvFiles(rootDir: string): Record<string, string> {
  const files = [".env", ".env.local", ".env.production", ".env.production.local"];
  const merged: Record<string, string> = {};

  for (const fileName of files) {
    const filePath = join(rootDir, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    const parsed = parseDotEnv(readFileSync(filePath, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      merged[key] = value;
    }
  }

  return merged;
}

function parseRequiredEnvKeysFromExample(filePath: string): string[] {
  const required: string[] = [];
  const commentBuffer: string[] = [];

  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      commentBuffer.length = 0;
      continue;
    }

    if (line.startsWith("#")) {
      commentBuffer.push(line.slice(1).trim().toLowerCase());
      continue;
    }

    const match = line.match(/^([A-Z0-9_]+)\s*=/);
    if (!match) {
      commentBuffer.length = 0;
      continue;
    }

    const key = match[1];
    const isOptional = commentBuffer.some((comment) => comment.includes("optional"));
    if (!isOptional) {
      required.push(key);
    }

    commentBuffer.length = 0;
  }

  return Array.from(new Set(required));
}

function hasNonEmptyValue(input: string | undefined): boolean {
  return typeof input === "string" && input.trim().length > 0;
}

function printCommandOutput(result: CommandResult) {
  if (result.error) {
    console.error(result.error);
  }
  if (result.stdout.trim()) {
    console.log(result.stdout.trim());
  }
  if (result.stderr.trim()) {
    console.error(result.stderr.trim());
  }
}

async function run() {
  const rootDir = process.cwd();
  const envExamplePath = join(rootDir, ".env.example");
  if (!existsSync(envExamplePath)) {
    throw new Error(".env.example file is required for readiness checks");
  }

  const loadedEnv = loadLocalEnvFiles(rootDir);
  const effectiveEnv: NodeJS.ProcessEnv = {
    ...loadedEnv,
    ...process.env
  };

  const checkResults: CheckResult[] = [];

  const build = runCommand("npm run build", effectiveEnv);
  const buildOk = build.status === 0;
  checkResults.push({
    name: "npm run build",
    ok: buildOk,
    details: buildOk
      ? "build completed successfully"
      : `build failed with exit code ${String(build.status)}${build.error ? ` (${build.error})` : ""}`
  });
  if (!buildOk) {
    printCommandOutput(build);
  }

  const requiredEnvKeys = parseRequiredEnvKeysFromExample(envExamplePath);
  const missingEnvKeys = requiredEnvKeys.filter((key) => !hasNonEmptyValue(effectiveEnv[key]));
  const envOk = missingEnvKeys.length === 0;
  checkResults.push({
    name: "required env vars (.env.example)",
    ok: envOk,
    details: envOk
      ? `${requiredEnvKeys.length} required keys are configured`
      : `missing keys: ${missingEnvKeys.join(", ")}`
  });

  const migrateStatus = runCommand("npx prisma migrate status --schema prisma/schema.prisma", effectiveEnv);
  const migrationOk = migrateStatus.status === 0;
  checkResults.push({
    name: "prisma migrate status",
    ok: migrationOk,
    details: migrationOk
      ? "prisma migration status is in sync"
      : `prisma migrate status failed with exit code ${String(migrateStatus.status)}${
          migrateStatus.error ? ` (${migrateStatus.error})` : ""
        }`
  });
  if (!migrationOk) {
    printCommandOutput(migrateStatus);
  }

  console.log("\nProduction readiness checks:");
  for (const check of checkResults) {
    console.log(`- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.details}`);
  }

  const failed = checkResults.filter((check) => !check.ok);
  if (failed.length > 0) {
    process.exit(1);
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
