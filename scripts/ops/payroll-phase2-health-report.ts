import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

type NumericEnvOptions = {
  defaultValue: number;
  min?: number;
  max?: number;
};

function readBooleanEnv(name: string, defaultValue: boolean): boolean {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return defaultValue;
  }
  const value = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(value)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(value)) {
    return false;
  }
  throw new Error(`invalid boolean env ${name}: ${raw}`);
}

function readNumberEnv(name: string, options: NumericEnvOptions): number {
  const raw = process.env[name];
  if (!raw || !raw.trim()) {
    return options.defaultValue;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    throw new Error(`invalid numeric env ${name}: ${raw}`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new Error(`env ${name} must be >= ${options.min}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new Error(`env ${name} must be <= ${options.max}`);
  }
  return parsed;
}

function toPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

function appendSummary(lines: string[]) {
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) {
    return;
  }
  fs.appendFileSync(summaryPath, `${lines.join("\n")}\n`);
}

function readPayloadStatus(payload: unknown): number | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const status = (payload as Record<string, unknown>).status;
  return typeof status === "number" ? status : null;
}

function readPayloadMessage(payload: unknown): string | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const message = (payload as Record<string, unknown>).message;
  return typeof message === "string" ? message : null;
}

function isFeatureFlagDisabled409(message: string | null, flagName: string): boolean {
  if (!message) {
    return false;
  }
  return message.trim().toLowerCase() === `${flagName} feature flag is disabled`;
}

function formatTopMessageCounts(input: Record<string, number>, limit: number) {
  const entries = Object.entries(input).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit).map(([message, count]) => ({ message, count }));
}

async function run() {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error("DATABASE_URL and DIRECT_URL are required");
  }

  // These flags are passed from GitHub Actions (environment vars) to decide whether health should gate.
  // When phase2 is disabled, health still reports metrics but should not page/raise incidents.
  const deductionsEnabled = readBooleanEnv("FLOWHR_PAYROLL_DEDUCTIONS_V1", false);
  const profileEnabled = readBooleanEnv("FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1", false);

  const hours = readNumberEnv("FLOWHR_PHASE2_HEALTH_WINDOW_HOURS", {
    defaultValue: 24,
    min: 1,
    max: 168
  });
  const minAttempts = readNumberEnv("FLOWHR_PHASE2_HEALTH_MIN_ATTEMPTS", {
    defaultValue: 1,
    min: 1
  });
  const max403Ratio = readNumberEnv("FLOWHR_PHASE2_HEALTH_MAX_403_RATIO", {
    defaultValue: 0.2,
    min: 0,
    max: 1
  });
  const max409Ratio = readNumberEnv("FLOWHR_PHASE2_HEALTH_MAX_409_RATIO", {
    defaultValue: 0.2,
    min: 0,
    max: 1
  });

  const now = new Date();
  const since = new Date(now.getTime() - hours * 60 * 60 * 1000);
  const prisma = new PrismaClient();

  try {
    const actions = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: since },
        action: {
          in: [
            "payroll.deductions_calculated",
            "payroll.preview_with_deductions.failed",
            "payroll.confirmed"
          ]
        }
      },
      select: {
        action: true,
        payload: true,
        createdAt: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    let deductionsCalculated = 0;
    let confirmed = 0;
    let previewFailed403 = 0;
    let previewFailed409Mismatch = 0;
    let previewFailed409Expected = 0;
    let previewFailed409Ignored = 0;
    let previewFailedOther = 0;
    const preview409Messages: Record<string, number> = {};

    for (const row of actions) {
      if (row.action === "payroll.deductions_calculated") {
        deductionsCalculated += 1;
      } else if (row.action === "payroll.confirmed") {
        confirmed += 1;
      } else if (row.action === "payroll.preview_with_deductions.failed") {
        const status = readPayloadStatus(row.payload);
        const message = readPayloadMessage(row.payload);
        if (status === 403) {
          previewFailed403 += 1;
        } else if (status === 409) {
          const messageKey = message?.trim() || "<missing-message>";
          preview409Messages[messageKey] = (preview409Messages[messageKey] ?? 0) + 1;

          const phase2FlagDisabled = isFeatureFlagDisabled409(
            message,
            "payroll_deductions_v1"
          );
          const profileFlagDisabled = isFeatureFlagDisabled409(
            message,
            "payroll_deduction_profile_v1"
          );

          // 409 is often used for business input conflicts. For health gating, we only treat
          // feature-flag mismatch 409s as gate-relevant signals.
          if (phase2FlagDisabled) {
            if (!deductionsEnabled) {
              previewFailed409Expected += 1;
            } else {
              previewFailed409Mismatch += 1;
            }
          } else if (profileFlagDisabled) {
            if (!profileEnabled) {
              previewFailed409Expected += 1;
            } else {
              previewFailed409Mismatch += 1;
            }
          } else {
            previewFailed409Ignored += 1;
          }
        } else {
          previewFailedOther += 1;
        }
      }
    }

    const previewAttemptsAll =
      deductionsCalculated +
      previewFailed403 +
      previewFailed409Mismatch +
      previewFailed409Expected +
      previewFailed409Ignored +
      previewFailedOther;

    const previewAttemptsForGate =
      deductionsCalculated + previewFailed403 + previewFailed409Mismatch + previewFailedOther;

    const ratio403 = previewAttemptsForGate > 0 ? previewFailed403 / previewAttemptsForGate : 0;
    const ratio409 =
      previewAttemptsForGate > 0 ? previewFailed409Mismatch / previewAttemptsForGate : 0;

    const top409Messages = formatTopMessageCounts(preview409Messages, 5);

    const report = {
      phase2Enabled: deductionsEnabled,
      profileEnabled,
      windowHours: hours,
      since: since.toISOString(),
      until: now.toISOString(),
      deductionsCalculated,
      confirmed,
      previewAttempts: previewAttemptsAll,
      previewAttemptsForGate,
      previewFailed403,
      previewFailed409Mismatch,
      previewFailed409Expected,
      previewFailed409Ignored,
      previewFailedOther,
      ratio403,
      ratio409,
      top409Messages,
      thresholds: {
        minAttempts,
        max403Ratio,
        max409Ratio
      }
    };

    console.log(JSON.stringify(report, null, 2));

    const summaryLines = [
      "## Payroll Phase2 Health",
      "",
      `- Phase2 enabled: ${deductionsEnabled ? "true" : "false"}`,
      `- Profile enabled: ${profileEnabled ? "true" : "false"}`,
      `- Window: last ${hours}h`,
      `- Deductions Calculated: ${deductionsCalculated}`,
      `- Confirmed: ${confirmed}`,
      `- Preview Attempts: ${previewAttemptsAll}`,
      `- Preview Attempts (gate): ${previewAttemptsForGate}`,
      `- Failed 403: ${previewFailed403} (${toPercent(ratio403)})`,
      `- Failed 409 (mismatch): ${previewFailed409Mismatch} (${toPercent(ratio409)})`,
      `- Failed 409 (expected): ${previewFailed409Expected}`,
      `- Failed 409 (ignored): ${previewFailed409Ignored}`,
      `- Failed Other: ${previewFailedOther}`
    ];
    appendSummary(summaryLines);

    if (top409Messages.length > 0) {
      appendSummary([
        "",
        "### 409 message breakdown (top 5)",
        ...top409Messages.map((entry) => `- ${entry.count}x: ${entry.message}`)
      ]);
    }

    if (!deductionsEnabled) {
      appendSummary(["", "- Gate: skipped (FLOWHR_PAYROLL_DEDUCTIONS_V1=false)"]);
      return;
    }

    const failedChecks: string[] = [];
    if (previewAttemptsForGate >= minAttempts && ratio403 > max403Ratio) {
      failedChecks.push(`403 ratio ${toPercent(ratio403)} exceeds ${toPercent(max403Ratio)}`);
    }
    if (previewAttemptsForGate >= minAttempts && ratio409 > max409Ratio) {
      failedChecks.push(`409 mismatch ratio ${toPercent(ratio409)} exceeds ${toPercent(max409Ratio)}`);
    }

    if (failedChecks.length > 0) {
      throw new Error(`phase2 health gate failed: ${failedChecks.join("; ")}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(String(error));
  process.exit(1);
});
