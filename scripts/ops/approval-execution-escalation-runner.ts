import { appendFile } from "node:fs/promises";

import type { Actor } from "@/lib/actor";
import type { ApprovalDomain } from "@/features/shared/data-access";
import { triggerApprovalExecutionEscalation } from "@/features/approval/service";
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

function readIntegerEnv(name: string, fallback: number, min: number, max: number) {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} must be an integer in range ${min}..${max}`);
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

function readOptionalDomain(name: string): ApprovalDomain | undefined {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return undefined;
  }
  const normalized = raw.trim().toUpperCase();
  if (normalized === "ATTENDANCE" || normalized === "LEAVE" || normalized === "PAYROLL") {
    return normalized;
  }
  throw new Error(`${name} must be one of ATTENDANCE, LEAVE, PAYROLL`);
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
  requestedAt: string;
  stalledHoursMin: number;
  limit: number;
  domain: ApprovalDomain | null;
  notificationChannel: string;
  totalOrganizations: number;
  totalPending: number;
  totalCandidates: number;
  totalRequested: number;
  organizations: Array<{
    organizationId: string;
    pending: number;
    candidates: number;
    requested: number;
    dryRunCount: number;
    skippedNoCandidate: number;
  }>;
}) {
  const lines: string[] = [
    "## Approval Execution Escalation Sweep",
    "",
    `- dryRun: ${input.dryRun}`,
    `- requestedAt: ${input.requestedAt}`,
    `- stalledHoursMin: ${input.stalledHoursMin}`,
    `- limit: ${input.limit}`,
    `- domain: ${input.domain ?? "ALL"}`,
    `- notificationChannel: ${input.notificationChannel}`,
    `- totalOrganizations: ${input.totalOrganizations}`,
    `- totalPending: ${input.totalPending}`,
    `- totalCandidates: ${input.totalCandidates}`,
    `- totalRequested: ${input.totalRequested}`,
    "",
    "| organizationId | pending | candidates | requested | dryRun | skippedNoCandidate |",
    "| --- | ---: | ---: | ---: | ---: | ---: |"
  ];

  for (const row of input.organizations) {
    lines.push(
      `| ${row.organizationId} | ${row.pending} | ${row.candidates} | ${row.requested} | ${row.dryRunCount} | ${row.skippedNoCandidate} |`
    );
  }

  if (input.organizations.length === 0) {
    lines.push("| (none) | 0 | 0 | 0 | 0 | 0 |");
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
  const dataAccess = getRuntimeDataAccess();
  let organizationIds = readOrganizationIds("FLOWHR_APPROVAL_EXECUTION_ESCALATION_ORGANIZATION_IDS");
  if (organizationIds.length === 0) {
    const organizations = await dataAccess.organizations.list();
    organizationIds = organizations.map((organization) => organization.id);
  }

  const dryRun = readBooleanEnv("FLOWHR_APPROVAL_EXECUTION_ESCALATION_DRY_RUN", false);
  const asOf = readDateEnv("FLOWHR_APPROVAL_EXECUTION_ESCALATION_AS_OF");
  const stalledHoursMin = readIntegerEnv(
    "FLOWHR_APPROVAL_EXECUTION_ESCALATION_STALLED_HOURS_MIN",
    24,
    1,
    24 * 365
  );
  const limit = readIntegerEnv("FLOWHR_APPROVAL_EXECUTION_ESCALATION_LIMIT", 50, 1, 500);
  const domain = readOptionalDomain("FLOWHR_APPROVAL_EXECUTION_ESCALATION_DOMAIN");
  const notificationChannel =
    process.env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_NOTIFICATION_CHANNEL?.trim() ||
    "approval-stalled-queue";
  const actorId =
    process.env.FLOWHR_APPROVAL_EXECUTION_ESCALATION_ACTOR_ID?.trim() ||
    "system:approval-execution-escalation-scheduler";

  const actor: Actor = {
    id: actorId,
    role: "system",
    organizationId: null
  };

  const organizations: Array<{
    organizationId: string;
    pending: number;
    candidates: number;
    requested: number;
    dryRunCount: number;
    skippedNoCandidate: number;
  }> = [];
  let totalPending = 0;
  let totalCandidates = 0;
  let totalRequested = 0;
  let requestedAt = new Date().toISOString();

  for (const organizationId of organizationIds) {
    const result = await triggerApprovalExecutionEscalation(
      {
        actor,
        dataAccess
      },
      {
        organizationId,
        domain,
        stalledHoursMin,
        limit,
        asOf,
        dryRun,
        notificationChannel
      }
    );
    requestedAt = result.requestedAt;
    totalPending += result.counts.totalPending;
    totalCandidates += result.counts.candidates;
    totalRequested += result.counts.requested;
    organizations.push({
      organizationId,
      pending: result.counts.totalPending,
      candidates: result.counts.candidates,
      requested: result.counts.requested,
      dryRunCount: result.counts.dryRun,
      skippedNoCandidate: result.counts.skippedNoCandidate
    });
  }

  const lines = buildSummaryLines({
    dryRun,
    requestedAt,
    stalledHoursMin,
    limit,
    domain: domain ?? null,
    notificationChannel,
    totalOrganizations: organizations.length,
    totalPending,
    totalCandidates,
    totalRequested,
    organizations
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
