import Link from "next/link";
import { type KpiCopy } from "@/components/admin-kpi/copy";
import { type AdminKpiFocusMetric } from "@/components/admin-kpi/AdminKpiSections";

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
  analyticsFocusMetric?: AdminKpiFocusMetric;
};

type PayrollRiskActionLink = {
  href: string;
  label: string;
};

type AnalyticsContextOptions = {
  focusMetric?: string;
  analyticsFocusMetric?: AdminKpiFocusMetric;
};

function withAnalyticsSourceContext(
  href: string,
  options?: AnalyticsContextOptions
) {
  if (!options?.analyticsFocusMetric) {
    return href;
  }
  const contextParams = new URLSearchParams({ source: "admin-analytics" });
  if (options.focusMetric) {
    contextParams.set("focusMetric", options.focusMetric);
  }
  if (options.analyticsFocusMetric !== "all") {
    contextParams.set("analyticsFocus", options.analyticsFocusMetric);
  }
  const separator = href.includes("?") ? "&" : "?";
  return `${href}${separator}${contextParams.toString()}`;
}

function resolvePrimaryPayrollRiskAction(
  snapshot: PayrollRiskKpiSnapshot,
  copy: KpiCopy
) {
  if (snapshot.previewedRunCount > 0) {
    return {
      href: "/admin/payroll-close/previewed",
      label: copy.payrollRiskPanel.actionOpenPayrollClose,
      reason: copy.payrollRiskPanel.priorityReasonPreviewed
    };
  }
  if (snapshot.confirmedUndistributedCount > 0) {
    return {
      href: "/admin/payroll-payslip-delivery/undistributed",
      label: copy.payrollRiskPanel.actionOpenPayslipDelivery,
      reason: copy.payrollRiskPanel.priorityReasonUndistributed
    };
  }
  if (snapshot.distributedUnacknowledgedCount > 0) {
    return {
      href: "/admin/payroll-payslip-delivery",
      label: copy.payrollRiskPanel.actionOpenPayslipDelivery,
      reason: copy.payrollRiskPanel.priorityReasonUnacknowledged
    };
  }
  return {
    href: "/admin/payroll-year-end",
    label: copy.payrollRiskPanel.actionOpenYearEnd,
    reason: copy.payrollRiskPanel.priorityReasonReady
  };
}

function buildPayrollRiskQuickActions(copy: KpiCopy): PayrollRiskActionLink[] {
  return [
    {
      href: "/admin/payroll-close",
      label: copy.payrollRiskPanel.actionOpenPayrollClose
    },
    {
      href: "/admin/payroll-payslip-delivery",
      label: copy.payrollRiskPanel.actionOpenPayslipDelivery
    },
    {
      href: "/admin/payroll-year-end",
      label: copy.payrollRiskPanel.actionOpenYearEnd
    }
  ];
}

export function AdminPayrollRiskKpiPanel({
  copy,
  snapshot,
  analyticsFocusMetric
}: AdminPayrollRiskKpiPanelProps) {
  const primaryAction = resolvePrimaryPayrollRiskAction(snapshot, copy);
  const quickActions = buildPayrollRiskQuickActions(copy);
  const primaryActionHref = withAnalyticsSourceContext(primaryAction.href, {
    focusMetric: "payrollConfirmedRate",
    analyticsFocusMetric
  });
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
      <section style={{ marginTop: 12 }}>
        <p className="small muted">{copy.payrollRiskPanel.priorityActionLabel}</p>
        <p className="small" style={{ marginTop: 4 }}>
          {primaryAction.reason}
        </p>
        <div className="actions" style={{ marginTop: 8 }}>
          <Link href={primaryActionHref} className="btn btn-primary btn-small">
            {primaryAction.label}
          </Link>
        </div>
        <p className="small muted" style={{ marginTop: 10 }}>
          {copy.payrollRiskPanel.quickActionsLabel}
        </p>
        <div className="actions" style={{ marginTop: 6 }}>
          {quickActions.map((action) => (
            <Link
              key={action.href}
              href={withAnalyticsSourceContext(action.href, {
                focusMetric: "payrollConfirmedRate",
                analyticsFocusMetric
              })}
              className="btn btn-secondary btn-small"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
