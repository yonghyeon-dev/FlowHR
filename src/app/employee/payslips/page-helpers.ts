export type PayrollRunDto = {
  id: string;
  organizationId: string | null;
  employeeId: string | null;
  periodStart: string;
  periodEnd: string;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  withholdingTaxKrw: number | null;
  socialInsuranceKrw: number | null;
  otherDeductionsKrw: number | null;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  deductionBreakdown: Record<string, unknown> | null;
  confirmedAt: string | null;
};

export type AttendanceAggregateDto = {
  employeeId: string;
  counts: {
    payable: number;
  };
  totals: {
    regular: number;
    overtime: number;
    night: number;
    holiday: number;
  };
};

export type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
};

export type CompareMetric = {
  id: string;
  label: string;
  selectedValue: number | null;
  compareValue: number | null;
  diffValue: number | null;
  diffRate: number | null;
};

export type CompareInsightTone = "up" | "down" | "flat";

export type CompareInsightCard = {
  key: string;
  title: string;
  tone: CompareInsightTone;
  message: string;
};

export type PayslipSearchScope = "all" | "run_id" | "period" | "state";
export type PayslipSortOption = "latest_desc" | "oldest_asc" | "net_desc" | "gross_desc";

export type PayslipSearchRow = {
  key: string;
  runId: string;
  periodLabel: string;
  state: PayrollRunDto["state"];
  stateLabel: string;
  stateSearchText: string;
  grossPayKrw: number;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  confirmedAt: string | null;
  sortTimestamp: number;
};

export type BreakdownRecord = Record<string, unknown>;

export type DeductionExplainItem = {
  key: string;
  label: string;
  amountKrw: number | null;
  description: string;
};

export type DeductionExplainSection = {
  id: string;
  title: string;
  items: DeductionExplainItem[];
};

export function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

export function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

export function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

export function previousMonthRangeLocal() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return {
    start: toLocalInputValue(new Date(year, month, 1, 0, 0, 0)),
    end: toLocalInputValue(new Date(year, month + 1, 0, 23, 59, 0))
  };
}

export function lastThreeMonthsRangeLocal() {
  const now = new Date();
  return {
    start: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0)),
    end: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0))
  };
}

export function toIso(value: string) {
  return new Date(value).toISOString();
}

export function minutesToHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

export function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function escapeCsv(value: string) {
  const needsQuote = value.includes(",") || value.includes("\"") || value.includes("\n");
  const escaped = value.replace(/"/g, "\"\"");
  return needsQuote ? `"${escaped}"` : escaped;
}

export function toBreakdownRecord(value: unknown): BreakdownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as BreakdownRecord;
}

export function toNumberOrNull(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function toTimestamp(value: string | null) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

export function matchesPayslipSearch(scope: PayslipSearchScope, query: string, row: PayslipSearchRow) {
  if (!query) {
    return true;
  }

  if (scope === "run_id") {
    return row.runId.toLowerCase().includes(query);
  }
  if (scope === "period") {
    return row.periodLabel.toLowerCase().includes(query);
  }
  if (scope === "state") {
    return row.stateSearchText.includes(query);
  }

  return (
    row.runId.toLowerCase().includes(query) ||
    row.periodLabel.toLowerCase().includes(query) ||
    row.stateSearchText.includes(query)
  );
}

export function sortPayslipSearchRows(rows: PayslipSearchRow[], option: PayslipSortOption) {
  return [...rows].sort((left, right) => {
    if (option === "oldest_asc") {
      return left.sortTimestamp - right.sortTimestamp;
    }
    if (option === "net_desc") {
      const netDiff = (right.netPayKrw ?? 0) - (left.netPayKrw ?? 0);
      if (netDiff !== 0) {
        return netDiff;
      }
      return right.sortTimestamp - left.sortTimestamp;
    }
    if (option === "gross_desc") {
      const grossDiff = right.grossPayKrw - left.grossPayKrw;
      if (grossDiff !== 0) {
        return grossDiff;
      }
      return right.sortTimestamp - left.sortTimestamp;
    }
    return right.sortTimestamp - left.sortTimestamp;
  });
}

export function safeDiff(selectedValue: number | null, compareValue: number | null) {
  if (selectedValue === null || compareValue === null) {
    return null;
  }
  return selectedValue - compareValue;
}

export function safeDiffRate(selectedValue: number | null, compareValue: number | null) {
  if (selectedValue === null || compareValue === null || compareValue === 0) {
    return null;
  }
  return ((selectedValue - compareValue) / compareValue) * 100;
}

export function buildCompareMetrics(
  selectedRun: PayrollRunDto | null,
  compareRun: PayrollRunDto | null,
  labels: { gross: string; deduction: string; net: string }
): CompareMetric[] {
  if (!selectedRun || !compareRun) {
    return [];
  }

  const rows: Array<{ id: string; label: string; selectedValue: number | null; compareValue: number | null }> = [
    {
      id: "gross",
      label: labels.gross,
      selectedValue: selectedRun.grossPayKrw,
      compareValue: compareRun.grossPayKrw
    },
    {
      id: "deduction",
      label: labels.deduction,
      selectedValue: selectedRun.totalDeductionsKrw,
      compareValue: compareRun.totalDeductionsKrw
    },
    {
      id: "net",
      label: labels.net,
      selectedValue: selectedRun.netPayKrw,
      compareValue: compareRun.netPayKrw
    }
  ];

  return rows.map((row) => ({
    ...row,
    diffValue: safeDiff(row.selectedValue, row.compareValue),
    diffRate: safeDiffRate(row.selectedValue, row.compareValue)
  }));
}

export function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toFixed(1)}%`;
}

function toInsightTone(diffValue: number | null): CompareInsightTone {
  if (diffValue === null || diffValue === 0) {
    return "flat";
  }
  return diffValue > 0 ? "up" : "down";
}

function toInsightDirectionLabel(tone: CompareInsightTone, isKoLocale: boolean) {
  if (isKoLocale) {
    if (tone === "up") {
      return "증가";
    }
    if (tone === "down") {
      return "감소";
    }
    return "유지";
  }

  if (tone === "up") {
    return "up";
  }
  if (tone === "down") {
    return "down";
  }
  return "flat";
}

function toInsightReason(metricId: string, tone: CompareInsightTone, isKoLocale: boolean) {
  if (isKoLocale) {
    if (metricId === "gross") {
      if (tone === "up") {
        return "근무시간/지급항목 증가 영향";
      }
      if (tone === "down") {
        return "근무시간/지급항목 감소 영향";
      }
      return "지급 항목이 전월과 유사합니다";
    }

    if (metricId === "deduction") {
      if (tone === "up") {
        return "법정공제 또는 추가공제 증가 영향";
      }
      if (tone === "down") {
        return "공제 항목 완화 또는 조정 영향";
      }
      return "공제 구조가 전월과 유사합니다";
    }

    if (tone === "up") {
      return "실수령 개선 흐름";
    }
    if (tone === "down") {
      return "공제/지급 변화로 실수령 감소";
    }
    return "실수령 흐름이 안정적입니다";
  }

  if (metricId === "gross") {
    if (tone === "up") {
      return "higher payable hours or payout items";
    }
    if (tone === "down") {
      return "lower payable hours or payout items";
    }
    return "similar payout structure vs previous month";
  }

  if (metricId === "deduction") {
    if (tone === "up") {
      return "higher statutory or additional deductions";
    }
    if (tone === "down") {
      return "reduced deduction load";
    }
    return "deduction structure is stable month-over-month";
  }

  if (tone === "up") {
    return "improved take-home trend";
  }
  if (tone === "down") {
    return "take-home reduced by payout/deduction changes";
  }
  return "stable take-home trend";
}

export function buildCompareInsightCards(metrics: CompareMetric[], isKoLocale: boolean): CompareInsightCard[] {
  return metrics.map((metric) => {
    const tone = toInsightTone(metric.diffValue);
    const directionLabel = toInsightDirectionLabel(tone, isKoLocale);
    const rateText = metric.diffRate === null ? "-" : `${metric.diffRate.toFixed(1)}%`;
    const reason = toInsightReason(metric.id, tone, isKoLocale);

    if (isKoLocale) {
      return {
        key: metric.id,
        title: `${metric.label} 전월 대비`,
        tone,
        message: `${directionLabel} (${rateText}) · ${reason}`
      };
    }

    return {
      key: metric.id,
      title: `${metric.label} month-over-month`,
      tone,
      message: `${directionLabel} (${rateText}) · ${reason}`
    };
  });
}
