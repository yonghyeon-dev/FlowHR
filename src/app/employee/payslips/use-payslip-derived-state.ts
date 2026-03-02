import { useMemo } from "react";

import {
  formatEmployeeIdForLocaleDisplay,
  getLocalizedEmployeeIdInputDefault,
  normalizeEmployeeIdForApi
} from "@/lib/i18n/employee-id-locale";
import {
  type DeductionDescriptionMap,
  extractErrorMessage,
  formatCompareWindowLabel,
  formatDateOnly,
  resolveCompareInsightAriaLabel,
  resolveCompareInsightTitle,
  resolvePayslipRunStateLabel,
  type PayslipPageCopy
} from "@/app/employee/payslips/page-locale-helpers";
import {
  buildCompareInsightCards,
  buildCompareMetrics,
  matchesPayslipSearch,
  sortPayslipSearchRows,
  toBreakdownRecord,
  toNumberOrNull,
  toTimestamp,
  type ApiLog,
  type CompareInsightCard,
  type CompareMetric,
  type DeductionExplainItem,
  type DeductionExplainSection,
  type PayrollRunDto,
  type PayslipSearchScope,
  type PayslipSortOption
} from "@/app/employee/payslips/page-helpers";

type DerivedTone = "idle" | "ok" | "fail";

interface UsePayslipDerivedStateInput {
  compareRunId: string;
  deductionDescriptionMap: DeductionDescriptionMap;
  employeeId: string;
  isKoLocale: boolean;
  logs: ApiLog[];
  pageCopy: PayslipPageCopy;
  payslipSearchQuery: string;
  payslipSearchScope: PayslipSearchScope;
  payslipSortOption: PayslipSortOption;
  runs: PayrollRunDto[];
  selectedRunId: string;
}

interface UsePayslipDerivedStateOutput {
  compareCandidates: PayrollRunDto[];
  compareInsightAriaLabel: string;
  compareInsightCards: CompareInsightCard[];
  compareInsightTitle: string;
  compareMetrics: CompareMetric[];
  compareRun: PayrollRunDto | null;
  compareWindowLabel: string;
  deductionExplainSections: DeductionExplainSection[];
  filteredPayslipSearchRows: ReturnType<typeof sortPayslipSearchRows>;
  latestFailedLog: ApiLog | null;
  latestFailureMessage: string;
  latestLog: ApiLog | null;
  payslipFileName: string;
  payslipStats: {
    count: number;
    totalDeductions: number;
    totalGross: number;
    totalNet: number;
  };
  selectedRun: PayrollRunDto | null;
  stats: {
    fail: number;
    success: number;
    total: number;
  };
  statusFeedbackMessage: string;
  statusFeedbackTone: DerivedTone;
  statusRecoveryGuide: string;
}

function resolveDeductionFallbackLabel(
  key: string,
  isKoLocale: boolean,
  kind: "component" | "tax-credit"
) {
  if (!isKoLocale) {
    return key;
  }
  return kind === "component" ? "기타 공제 항목" : "기타 세액공제 항목";
}

export function usePayslipDerivedState(input: UsePayslipDerivedStateInput): UsePayslipDerivedStateOutput {
  const {
    compareRunId,
    deductionDescriptionMap,
    employeeId,
    isKoLocale,
    logs,
    pageCopy,
    payslipSearchQuery,
    payslipSearchScope,
    payslipSortOption,
    runs,
    selectedRunId
  } = input;

  const normalizedPayslipSearchQuery = payslipSearchQuery.trim().toLowerCase();

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  const payslipStats = useMemo(() => {
    const totalGross = runs.reduce((sum, run) => sum + run.grossPayKrw, 0);
    const totalDeductions = runs.reduce((sum, run) => sum + (run.totalDeductionsKrw ?? 0), 0);
    const totalNet = runs.reduce((sum, run) => sum + (run.netPayKrw ?? 0), 0);
    return {
      count: runs.length,
      totalGross,
      totalDeductions,
      totalNet
    };
  }, [runs]);

  const payslipSearchRows = useMemo(() => {
    return runs.map((run) => {
      const confirmedAtTs = toTimestamp(run.confirmedAt);
      const periodEndTs = toTimestamp(run.periodEnd);
      const stateLabel = resolvePayslipRunStateLabel(run.state, isKoLocale);
      return {
        key: run.id,
        runId: run.id,
        periodLabel: `${formatDateOnly(run.periodStart)} ~ ${formatDateOnly(run.periodEnd)}`,
        state: run.state,
        stateLabel,
        stateSearchText: `${run.state.toLowerCase()} ${stateLabel.toLowerCase()}`,
        grossPayKrw: run.grossPayKrw,
        totalDeductionsKrw: run.totalDeductionsKrw,
        netPayKrw: run.netPayKrw,
        confirmedAt: run.confirmedAt,
        sortTimestamp: confirmedAtTs > 0 ? confirmedAtTs : periodEndTs
      };
    });
  }, [isKoLocale, runs]);

  const filteredPayslipSearchRows = useMemo(() => {
    const filtered = payslipSearchRows.filter((row) =>
      matchesPayslipSearch(payslipSearchScope, normalizedPayslipSearchQuery, row)
    );
    return sortPayslipSearchRows(filtered, payslipSortOption);
  }, [normalizedPayslipSearchQuery, payslipSearchRows, payslipSearchScope, payslipSortOption]);

  const selectedRun = useMemo(
    () => runs.find((run) => run.id === selectedRunId) ?? runs[0] ?? null,
    [runs, selectedRunId]
  );
  const selectedRunBreakdown = useMemo(
    () => toBreakdownRecord(selectedRun?.deductionBreakdown ?? null),
    [selectedRun]
  );

  const latestLog = useMemo(() => logs[0] ?? null, [logs]);
  const latestFailedLog = useMemo(() => logs.find((log) => !log.ok) ?? null, [logs]);

  const statusFeedbackTone = useMemo<DerivedTone>(() => {
    if (!latestLog) {
      return "idle";
    }
    return latestLog.ok ? "ok" : "fail";
  }, [latestLog]);

  const statusFeedbackMessage = useMemo(() => {
    if (!latestLog) {
      return pageCopy.status.noRecentResult;
    }
    if (latestLog.ok) {
      return `${latestLog.label} ${pageCopy.status.successSuffix}`;
    }
    return `${latestLog.label} ${pageCopy.status.failureSuffix}`;
  }, [latestLog, pageCopy.status.failureSuffix, pageCopy.status.noRecentResult, pageCopy.status.successSuffix]);

  const latestFailureMessage = useMemo(() => {
    if (!latestFailedLog) {
      return "";
    }
    return extractErrorMessage(latestFailedLog.body);
  }, [latestFailedLog]);

  const statusRecoveryGuide = useMemo(() => {
    if (!latestFailedLog) {
      return pageCopy.status.guideIfNoFailure;
    }
    return pageCopy.status.guideIfFailure;
  }, [latestFailedLog, pageCopy.status.guideIfFailure, pageCopy.status.guideIfNoFailure]);

  const compareCandidates = useMemo(() => {
    if (!selectedRun) {
      return [] as PayrollRunDto[];
    }
    return runs
      .filter((run) => run.id !== selectedRun.id)
      .sort((left, right) => toTimestamp(right.periodStart) - toTimestamp(left.periodStart));
  }, [runs, selectedRun]);

  const compareRun = useMemo(() => {
    if (compareCandidates.length === 0) {
      return null;
    }
    return compareCandidates.find((run) => run.id === compareRunId) ?? compareCandidates[0];
  }, [compareCandidates, compareRunId]);

  const compareMetrics = useMemo(() => {
    return buildCompareMetrics(selectedRun, compareRun, pageCopy.compare.metrics);
  }, [compareRun, pageCopy.compare.metrics, selectedRun]);

  const compareInsightCards = useMemo(() => {
    return buildCompareInsightCards(compareMetrics, isKoLocale);
  }, [compareMetrics, isKoLocale]);

  const compareInsightTitle = useMemo(() => resolveCompareInsightTitle(isKoLocale), [isKoLocale]);
  const compareInsightAriaLabel = useMemo(() => resolveCompareInsightAriaLabel(isKoLocale), [isKoLocale]);

  const compareWindowLabel = useMemo(() => {
    if (!selectedRun || !compareRun) {
      return "-";
    }
    const selectedLabel = `${formatDateOnly(selectedRun.periodStart)} ~ ${formatDateOnly(selectedRun.periodEnd)}`;
    const compareLabel = `${formatDateOnly(compareRun.periodStart)} ~ ${formatDateOnly(compareRun.periodEnd)}`;
    return formatCompareWindowLabel(selectedLabel, compareLabel, isKoLocale);
  }, [compareRun, isKoLocale, selectedRun]);

  const fixedDeductionExplainItems = useMemo(() => {
    if (!selectedRun) {
      return [] as DeductionExplainItem[];
    }
    return [
      {
        key: "withholdingTaxKrw",
        label: deductionDescriptionMap.withholdingTaxKrw.label,
        amountKrw: selectedRun.withholdingTaxKrw,
        description: deductionDescriptionMap.withholdingTaxKrw.description
      },
      {
        key: "socialInsuranceKrw",
        label: deductionDescriptionMap.socialInsuranceKrw.label,
        amountKrw: selectedRun.socialInsuranceKrw,
        description: deductionDescriptionMap.socialInsuranceKrw.description
      },
      {
        key: "otherDeductionsKrw",
        label: deductionDescriptionMap.otherDeductionsKrw.label,
        amountKrw: selectedRun.otherDeductionsKrw,
        description: deductionDescriptionMap.otherDeductionsKrw.description
      }
    ];
  }, [deductionDescriptionMap, selectedRun]);

  const componentDeductionExplainItems = useMemo(() => {
    const additional = toBreakdownRecord(selectedRunBreakdown?.additional ?? null);
    const components = toBreakdownRecord(additional?.components ?? null);
    if (!components) {
      return [] as DeductionExplainItem[];
    }

    return Object.entries(components).flatMap(([key, value]) => {
      const amount = toNumberOrNull(value);
      if (amount === null || amount === 0) {
        return [];
      }
      const mapped = deductionDescriptionMap[key];
      return [
        {
          key,
          label: mapped?.label ?? resolveDeductionFallbackLabel(key, isKoLocale, "component"),
          amountKrw: amount,
          description: mapped?.description ?? pageCopy.deductionFallback.statutoryDetail
        }
      ];
    });
  }, [
    deductionDescriptionMap,
    isKoLocale,
    pageCopy.deductionFallback.statutoryDetail,
    selectedRunBreakdown
  ]);

  const taxCreditExplainItems = useMemo(() => {
    const additional = toBreakdownRecord(selectedRunBreakdown?.additional ?? null);
    const taxCredits = toBreakdownRecord(additional?.taxCreditsKrw ?? null);
    if (!taxCredits) {
      return [] as DeductionExplainItem[];
    }

    return ["preCreditIncomeTaxKrw", "dependentTaxCreditKrw", "additionalTaxCreditKrw", "totalTaxCreditKrw"].flatMap(
      (key) => {
        const amount = toNumberOrNull(taxCredits[key]);
        if (amount === null || amount === 0) {
          return [];
        }
        const mapped = deductionDescriptionMap[key];
        return [
          {
            key,
            label: mapped?.label ?? resolveDeductionFallbackLabel(key, isKoLocale, "tax-credit"),
            amountKrw: amount,
            description: mapped?.description ?? pageCopy.deductionFallback.taxCreditDetail
          }
        ];
      }
    );
  }, [deductionDescriptionMap, isKoLocale, pageCopy.deductionFallback.taxCreditDetail, selectedRunBreakdown]);

  const deductionExplainSections = useMemo(() => {
    if (!selectedRun) {
      return [] as DeductionExplainSection[];
    }
    return [
      {
        id: "fixed",
        title: pageCopy.detail.deductionGuideTitle,
        items: fixedDeductionExplainItems
      },
      {
        id: "component",
        title: pageCopy.detail.deductionComponentTitle,
        items: componentDeductionExplainItems
      },
      {
        id: "tax-credit",
        title: pageCopy.detail.taxCreditReferenceTitle,
        items: taxCreditExplainItems
      }
    ];
  }, [
    componentDeductionExplainItems,
    fixedDeductionExplainItems,
    pageCopy.detail.deductionComponentTitle,
    pageCopy.detail.deductionGuideTitle,
    pageCopy.detail.taxCreditReferenceTitle,
    selectedRun,
    taxCreditExplainItems
  ]);

  const payslipFileName = useMemo(() => {
    if (!selectedRun) {
      return "";
    }
    const period = new Date(selectedRun.periodStart);
    const year = Number.isNaN(period.getTime()) ? (isKoLocale ? "미확인" : "unknown") : String(period.getFullYear());
    const month = Number.isNaN(period.getTime()) ? "00" : String(period.getMonth() + 1).padStart(2, "0");
    const locale = isKoLocale ? "ko" : "en";
    const actorFallback = getLocalizedEmployeeIdInputDefault(locale);
    const actorSource = selectedRun.employeeId ?? employeeId ?? actorFallback;
    const actor = formatEmployeeIdForLocaleDisplay(normalizeEmployeeIdForApi(actorSource, locale), locale).replace(
      /\s+/g,
      "-"
    );
    const filePrefix = isKoLocale ? "플로우HR-급여명세" : "flowhr-payslip";
    return `${filePrefix}-${actor}-${year}${month}.pdf`;
  }, [employeeId, isKoLocale, selectedRun]);

  return {
    stats,
    payslipStats,
    filteredPayslipSearchRows,
    selectedRun,
    latestLog,
    latestFailedLog,
    statusFeedbackTone,
    statusFeedbackMessage,
    latestFailureMessage,
    statusRecoveryGuide,
    compareCandidates,
    compareRun,
    compareMetrics,
    compareInsightCards,
    compareInsightTitle,
    compareInsightAriaLabel,
    compareWindowLabel,
    deductionExplainSections,
    payslipFileName
  };
}

