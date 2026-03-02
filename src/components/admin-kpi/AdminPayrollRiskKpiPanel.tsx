import { type KpiCopy } from "@/components/admin-kpi/copy";

type PayrollRunRiskLite = {
  state: "PREVIEWED" | "CONFIRMED";
  confirmedAt: string | null;
  payslipDistributedAt: string | null;
  payslipReceiptConfirmedAt: string | null;
};

export type PayrollRiskKpiSnapshot = {
  totalRunCount: number;
  previewedRunCount: number;
  confirmedUndistributedCount: number;
  distributedUnacknowledgedCount: number;
  yearEndReadyRunCount: number;
  yearEndBlockingRunCount: number;
  yearEndReadinessPercent: number;
};

function resolvePercent(part: number, total: number) {
  if (total <= 0) {
    return 0;
  }
  return (part / total) * 100;
}

function formatPercent(value: number) {
  return `${Math.round(Math.max(0, Math.min(100, value)))}%`;
}

export function buildPayrollRiskKpiSnapshot(input: {
  runs: PayrollRunRiskLite[];
}): PayrollRiskKpiSnapshot {
  let previewedRunCount = 0;
  let confirmedUndistributedCount = 0;
  let distributedUnacknowledgedCount = 0;
  let yearEndReadyRunCount = 0;

  for (const run of input.runs) {
    const isConfirmed = run.state === "CONFIRMED" || Boolean(run.confirmedAt);
    if (!isConfirmed) {
      previewedRunCount += 1;
      continue;
    }
    if (!run.payslipDistributedAt) {
      confirmedUndistributedCount += 1;
      continue;
    }
    if (!run.payslipReceiptConfirmedAt) {
      distributedUnacknowledgedCount += 1;
      continue;
    }
    yearEndReadyRunCount += 1;
  }

  const totalRunCount = input.runs.length;
  const yearEndBlockingRunCount = Math.max(0, totalRunCount - yearEndReadyRunCount);
  const yearEndReadinessPercent = resolvePercent(yearEndReadyRunCount, totalRunCount);

  return {
    totalRunCount,
    previewedRunCount,
    confirmedUndistributedCount,
    distributedUnacknowledgedCount,
    yearEndReadyRunCount,
    yearEndBlockingRunCount,
    yearEndReadinessPercent
  };
}

type AdminPayrollRiskKpiPanelProps = {
  copy: KpiCopy;
  snapshot: PayrollRiskKpiSnapshot;
};

export function AdminPayrollRiskKpiPanel({
  copy,
  snapshot
}: AdminPayrollRiskKpiPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.payrollRiskPanel.title}</h2>
      <p className="small muted">{copy.payrollRiskPanel.description}</p>
      <div className="kpi-strip">
        <article className="kpi-card">
          <p>{copy.payrollRiskPanel.totalRunCount}</p>
          <strong>{snapshot.totalRunCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.payrollRiskPanel.previewedRunCount}</p>
          <strong>{snapshot.previewedRunCount}</strong>
        </article>
        <article className="kpi-card">
          <p>{copy.payrollRiskPanel.confirmedUndistributedCount}</p>
          <strong>{snapshot.confirmedUndistributedCount}</strong>
          <small>{copy.payrollRiskPanel.distributionHint}</small>
        </article>
        <article className="kpi-card">
          <p>{copy.payrollRiskPanel.distributedUnacknowledgedCount}</p>
          <strong>{snapshot.distributedUnacknowledgedCount}</strong>
          <small>{copy.payrollRiskPanel.receiptHint}</small>
        </article>
        <article className="kpi-card">
          <p>{copy.payrollRiskPanel.yearEndReadinessPercent}</p>
          <strong>{formatPercent(snapshot.yearEndReadinessPercent)}</strong>
          <small>
            {copy.payrollRiskPanel.yearEndBlockingRunCount}:{" "}
            {snapshot.yearEndBlockingRunCount}
          </small>
        </article>
      </div>
    </article>
  );
}
