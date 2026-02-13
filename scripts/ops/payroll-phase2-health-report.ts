import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

type NumericEnvOptions = {
  defaultValue: number;
  min?: number;
  max?: number;
};

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

async function run() {
  if (!process.env.DATABASE_URL || !process.env.DIRECT_URL) {
    throw new Error("DATABASE_URL and DIRECT_URL are required");
  }

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
    let previewFailed409 = 0;
    let previewFailedOther = 0;

    for (const row of actions) {
      if (row.action === "payroll.deductions_calculated") {
        deductionsCalculated += 1;
      } else if (row.action === "payroll.confirmed") {
        confirmed += 1;
      } else if (row.action === "payroll.preview_with_deductions.failed") {
        const status = readPayloadStatus(row.payload);
        if (status === 403) {
          previewFailed403 += 1;
        } else if (status === 409) {
          previewFailed409 += 1;
        } else {
          previewFailedOther += 1;
        }
      }
    }

    const previewAttempts =
      deductionsCalculated + previewFailed403 + previewFailed409 + previewFailedOther;
    const ratio403 = previewAttempts > 0 ? previewFailed403 / previewAttempts : 0;
    const ratio409 = previewAttempts > 0 ? previewFailed409 / previewAttempts : 0;

    const report = {
      windowHours: hours,
      since: since.toISOString(),
      until: now.toISOString(),
      deductionsCalculated,
      confirmed,
      previewAttempts,
      previewFailed403,
      previewFailed409,
      previewFailedOther,
      ratio403,
      ratio409,
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
      `- Window: last ${hours}h`,
      `- Deductions Calculated: ${deductionsCalculated}`,
      `- Confirmed: ${confirmed}`,
      `- Preview Attempts: ${previewAttempts}`,
      `- Failed 403: ${previewFailed403} (${toPercent(ratio403)})`,
      `- Failed 409: ${previewFailed409} (${toPercent(ratio409)})`,
      `- Failed Other: ${previewFailedOther}`
    ];
    appendSummary(summaryLines);

    const failedChecks: string[] = [];
    if (previewAttempts >= minAttempts && ratio403 > max403Ratio) {
      failedChecks.push(`403 ratio ${toPercent(ratio403)} exceeds ${toPercent(max403Ratio)}`);
    }
    if (previewAttempts >= minAttempts && ratio409 > max409Ratio) {
      failedChecks.push(`409 ratio ${toPercent(ratio409)} exceeds ${toPercent(max409Ratio)}`);
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
