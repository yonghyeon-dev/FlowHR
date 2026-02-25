import type {
  CompareInsightCard,
  CompareInsightTone,
  CompareMetric,
  PayrollRunDto
} from "@/app/employee/payslips/page-helpers";

function safeDiff(selectedValue: number | null, compareValue: number | null) {
  if (selectedValue === null || compareValue === null) {
    return null;
  }
  return selectedValue - compareValue;
}

function safeDiffRate(selectedValue: number | null, compareValue: number | null) {
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

export function buildCompareInsightCards(
  metrics: CompareMetric[],
  isKoLocale: boolean
): CompareInsightCard[] {
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
