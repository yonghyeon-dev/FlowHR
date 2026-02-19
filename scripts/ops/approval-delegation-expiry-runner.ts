import { appendFile } from "node:fs/promises";

import type { Actor } from "@/lib/actor";
import { expireApprovalDelegationsSweep } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { getPrisma } from "@/lib/prisma";

function isTruthy(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function readBooleanEnv(name: string, defaultValue: boolean) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") {
    return defaultValue;
  }
  return isTruthy(raw);
}

function readDateEnv(name: string): Date | undefined {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return undefined;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${name} must be a valid ISO datetime string`);
  }
  return parsed;
}

function readOrganizationIds(name: string): string[] {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return [];
  }

  const rows = raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  return Array.from(new Set(rows));
}

async function writeGitHubSummary(lines: string[]) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }
  await appendFile(summaryPath, `${lines.join("\n")}\n`, "utf8");
}

function buildSummaryLines(input: {
  dryRun: boolean;
  effectiveAt: string;
  totalOrganizations: number;
  totalCheckedCount: number;
  totalExpiredCount: number;
  organizations: Array<{
    organizationId: string;
    checkedCount: number;
    expiredCount: number;
  }>;
}) {
  const lines: string[] = [
    "## Approval Delegation Expiry Sweep",
    "",
    `- dryRun: ${input.dryRun}`,
    `- effectiveAt: ${input.effectiveAt}`,
    `- totalOrganizations: ${input.totalOrganizations}`,
    `- totalCheckedCount: ${input.totalCheckedCount}`,
    `- totalExpiredCount: ${input.totalExpiredCount}`,
    "",
    "| organizationId | checkedCount | expiredCount |",
    "| --- | ---: | ---: |"
  ];

  for (const row of input.organizations) {
    lines.push(`| ${row.organizationId} | ${row.checkedCount} | ${row.expiredCount} |`);
  }
  if (input.organizations.length === 0) {
    lines.push("| (none) | 0 | 0 |");
  }
  return lines;
}

async function disconnectPrismaIfNeeded() {
  const mode = (process.env.FLOWHR_DATA_ACCESS ?? "").trim().toLowerCase();
  if (mode === "memory") {
    return;
  }
  if (!process.env.DATABASE_URL) {
    return;
  }
  await getPrisma().$disconnect();
}

async function run() {
  const organizationIds = readOrganizationIds("FLOWHR_APPROVAL_DELEGATION_EXPIRY_ORGANIZATION_IDS");
  const dryRun = readBooleanEnv("FLOWHR_APPROVAL_DELEGATION_EXPIRY_DRY_RUN", false);
  const effectiveAt = readDateEnv("FLOWHR_APPROVAL_DELEGATION_EXPIRY_EFFECTIVE_AT");
  const actorId =
    process.env.FLOWHR_APPROVAL_DELEGATION_EXPIRY_ACTOR_ID?.trim() ||
    "system:approval-delegation-expiry-scheduler";

  const actor: Actor = {
    id: actorId,
    role: "system",
    organizationId: null
  };

  const result = await expireApprovalDelegationsSweep(
    {
      actor,
      dataAccess: getRuntimeDataAccess()
    },
    {
      organizationIds,
      expiresBeforeAt: effectiveAt,
      dryRun
    }
  );

  const lines = buildSummaryLines({
    dryRun: result.dryRun,
    effectiveAt: result.effectiveAt,
    totalOrganizations: result.totalOrganizations,
    totalCheckedCount: result.totalCheckedCount,
    totalExpiredCount: result.totalExpiredCount,
    organizations: result.organizations.map((row) => ({
      organizationId: row.organizationId,
      checkedCount: row.checkedCount,
      expiredCount: row.expiredCount
    }))
  });

  for (const line of lines) {
    console.log(line);
  }
  await writeGitHubSummary(lines);
}

run()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrismaIfNeeded();
  });
