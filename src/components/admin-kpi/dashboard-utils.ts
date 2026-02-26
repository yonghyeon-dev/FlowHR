import { type RangeKpi, type TrendRow } from "@/components/admin-kpi/AdminKpiSections";
import { type KpiCopy } from "@/components/admin-kpi/copy";
import { computeKpiDelta } from "@/features/admin-kpi/summary";

type BuildCsvPayloadInput = {
  analyticsMode: boolean;
  trendRows: TrendRow[];
  summary: RangeKpi["summary"];
  generatedAt: Date;
};

type CsvPayload = {
  fileName: string;
  content: string;
};

export function buildAdminKpiTrendRows(
  metrics: KpiCopy["metrics"],
  currentRangeKpi: RangeKpi | null,
  previousRangeKpi: RangeKpi | null
): TrendRow[] {
  if (!currentRangeKpi || !previousRangeKpi) {
    return [];
  }

  const rows: Omit<TrendRow, "delta">[] = [
    {
      key: "pending",
      label: metrics.pendingApprovals,
      current: currentRangeKpi.summary.approvalPendingCount,
      previous: previousRangeKpi.summary.approvalPendingCount,
      percent: false
    },
    {
      key: "stalled",
      label: metrics.stalledApprovals,
      current: currentRangeKpi.summary.approvalStalledCount,
      previous: previousRangeKpi.summary.approvalStalledCount,
      percent: false
    },
    {
      key: "attendanceRate",
      label: metrics.attendanceApprovalRate,
      current: currentRangeKpi.summary.attendanceApprovalRate,
      previous: previousRangeKpi.summary.attendanceApprovalRate,
      percent: true
    },
    {
      key: "leaveDays",
      label: metrics.leaveApprovedDays,
      current: currentRangeKpi.summary.leaveApprovedDays,
      previous: previousRangeKpi.summary.leaveApprovedDays,
      percent: false
    },
    {
      key: "payrollRate",
      label: metrics.payrollConfirmedRate,
      current: currentRangeKpi.summary.payrollConfirmedRate,
      previous: previousRangeKpi.summary.payrollConfirmedRate,
      percent: true
    }
  ];

  return rows.map((row) => ({ ...row, delta: computeKpiDelta(row.current, row.previous) }));
}

export function buildAdminKpiCsvPayload(input: BuildCsvPayloadInput): CsvPayload {
  const { analyticsMode, trendRows, summary, generatedAt } = input;
  const kpiRows = [
    toCsvRow(["section", "metric", "current", "previous", "delta"]),
    ...trendRows.map((row) => toCsvRow([analyticsMode ? "analytics" : "kpi", row.label, row.current, row.previous, row.delta]))
  ];
  const snapshotRows = [
    toCsvRow(["snapshot", "approvalPendingCount", summary.approvalPendingCount]),
    toCsvRow(["snapshot", "approvalStalledCount", summary.approvalStalledCount]),
    toCsvRow(["snapshot", "attendanceApprovalRate", summary.attendanceApprovalRate]),
    toCsvRow(["snapshot", "leaveApprovedDays", summary.leaveApprovedDays]),
    toCsvRow(["snapshot", "payrollConfirmedRate", summary.payrollConfirmedRate])
  ];
  const prefix = analyticsMode ? "flowhr-admin-analytics" : "flowhr-admin-kpi";
  const timestamp = generatedAt.toISOString().replace(/[:.]/g, "-");

  return {
    fileName: `${prefix}-${timestamp}.csv`,
    content: [...kpiRows, ...snapshotRows].join("\n")
  };
}

export function triggerCsvDownload(fileName: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = fileName;
  window.document.body.appendChild(anchor);
  anchor.click();
  window.document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
}

export function safeParseBody(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function toCsvRow(values: Array<string | number>) {
  return values
    .map((value) => {
      const text = String(value ?? "");
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
    })
    .join(",");
}
