export type PayrollPayslipDistributionResponse = {
  summary: {
    periodStart: string;
    periodEnd: string;
    dryRun: boolean;
    deliveryChannel: "in_app" | "email";
    runStates: {
      totalRuns: number;
      confirmedRuns: number;
      previewedRuns: number;
    };
    distribution: {
      targetCount: number;
      alreadyDistributedCount: number;
      newlyDistributedCount: number;
      targetRunIds: string[];
      alreadyDistributedRunIds: string[];
      newlyDistributedRunIds: string[];
    };
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export function defaultMonthRange() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  return {
    periodStartDate: start.toISOString().slice(0, 10),
    periodEndDate: end.toISOString().slice(0, 10)
  };
}

export function toSeoulStartIso(dateValue: string) {
  return `${dateValue}T00:00:00+09:00`;
}

export function toSeoulEndIso(dateValue: string) {
  return `${dateValue}T23:59:59+09:00`;
}
