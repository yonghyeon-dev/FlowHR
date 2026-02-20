"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type PayrollRunDto = {
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

type AttendanceAggregateDto = {
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

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
  body: unknown;
};

type CompareMetric = {
  id: string;
  label: string;
  selectedValue: number | null;
  compareValue: number | null;
  diffValue: number | null;
  diffRate: number | null;
};

type PayslipSearchScope = "all" | "run_id" | "period" | "state";
type PayslipSortOption = "latest_desc" | "oldest_asc" | "net_desc" | "gross_desc";

type PayslipSearchRow = {
  key: string;
  runId: string;
  periodLabel: string;
  state: PayrollRunDto["state"];
  grossPayKrw: number;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  confirmedAt: string | null;
  sortTimestamp: number;
};

type PayslipPredictionSeverity = "normal" | "watch" | "critical";

type PayslipConfirmationPredictionCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  etaLabel: string;
  detail: string;
  metricLabel: string;
  targetSectionId: string;
};

type PayslipHistorySortAccuracyCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  accuracyScore: number;
  matchedCount: number;
  totalCompared: number;
  detail: string;
  targetSectionId: string;
};

type PayslipDelayRiskPredictionCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  riskScore: number;
  rowCount: number;
  watchCount: number;
  criticalCount: number;
  averageAgeDays: number;
  maxAgeDays: number;
  etaLabel: string;
  detail: string;
  targetSectionId: string;
};

type PayslipMobileFollowUpTone = "ready" | "pending" | "fail";
type PayslipMobileFollowUpAction = "jump" | "prepare_delivery" | "send_simulation" | "copy_failure";

type PayslipMobileFollowUpCard = {
  key: string;
  label: string;
  tone: PayslipMobileFollowUpTone;
  detail: string;
  ctaLabel: string;
  action: PayslipMobileFollowUpAction;
  targetSectionId: string;
};

type PayslipMobileFollowUpRecommendationCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  detail: string;
  ctaLabel: string;
  action: PayslipMobileFollowUpAction;
  targetSectionId: string;
};

type PayslipHistorySortHardeningCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  accuracyScore: number;
  confidenceGap: number;
  totalCompared: number;
  responseLabel: string;
  detail: string;
  searchScope: PayslipSearchScope;
  searchQuery: string;
  recommendedSortOption: PayslipSortOption;
  targetSectionId: string;
};

type PayslipDelayRiskResponseCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  rowCount: number;
  watchCount: number;
  criticalCount: number;
  riskScore: number;
  responseWindow: string;
  responseLabel: string;
  detail: string;
  searchScope: PayslipSearchScope;
  searchQuery: string;
  recommendedSortOption: PayslipSortOption;
  targetSectionId: string;
};

type PayslipMobileFollowUpRecommendationUpgradeCard = {
  key: string;
  label: string;
  severity: PayslipPredictionSeverity;
  priorityScore: number;
  detail: string;
  ctaLabel: string;
  action: PayslipMobileFollowUpAction;
  targetSectionId: string;
};

type MobileDeliveryChannel = "kakao" | "email" | "sms";
type MobileDeliveryState = "idle" | "ready" | "sent" | "failed";

type BreakdownRecord = Record<string, unknown>;

type DeductionExplainItem = {
  key: string;
  label: string;
  amountKrw: number | null;
  description: string;
};

type DeductionExplainSection = {
  id: string;
  title: string;
  items: DeductionExplainItem[];
};

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

function previousMonthRangeLocal() {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  return {
    start: toLocalInputValue(new Date(year, month, 1, 0, 0, 0)),
    end: toLocalInputValue(new Date(year, month + 1, 0, 23, 59, 0))
  };
}

function lastThreeMonthsRangeLocal() {
  const now = new Date();
  return {
    start: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0)),
    end: toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0))
  };
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

function minutesToHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

function buildQuery(params: Record<string, string | undefined>) {
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

function escapeCsv(value: string) {
  const needsQuote = value.includes(",") || value.includes("\"") || value.includes("\n");
  const escaped = value.replace(/"/g, "\"\"");
  return needsQuote ? `"${escaped}"` : escaped;
}

function toBreakdownRecord(value: unknown): BreakdownRecord | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as BreakdownRecord;
}

function toNumberOrNull(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return value;
}

function toTimestamp(value: string | null) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

function payslipPredictionSeverityRank(severity: PayslipPredictionSeverity) {
  if (severity === "critical") {
    return 3;
  }
  if (severity === "watch") {
    return 2;
  }
  return 1;
}

function payslipPredictionToneFromSeverity(severity: PayslipPredictionSeverity): PayslipMobileFollowUpTone {
  if (severity === "critical") {
    return "fail";
  }
  if (severity === "watch") {
    return "pending";
  }
  return "ready";
}

function matchesPayslipSearch(scope: PayslipSearchScope, query: string, row: PayslipSearchRow) {
  if (!query) {
    return true;
  }

  const normalizedState = row.state.toLowerCase();
  if (scope === "run_id") {
    return row.runId.toLowerCase().includes(query);
  }
  if (scope === "period") {
    return row.periodLabel.toLowerCase().includes(query);
  }
  if (scope === "state") {
    return normalizedState.includes(query);
  }

  return (
    row.runId.toLowerCase().includes(query) ||
    row.periodLabel.toLowerCase().includes(query) ||
    normalizedState.includes(query)
  );
}

function sortPayslipSearchRows(rows: PayslipSearchRow[], option: PayslipSortOption) {
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

function payslipSortOptionLabel(option: PayslipSortOption) {
  if (option === "latest_desc") {
    return "latest-first";
  }
  if (option === "oldest_asc") {
    return "oldest-first";
  }
  if (option === "net_desc") {
    return "net-high";
  }
  return "gross-high";
}

function formatHourDistanceLabel(hours: number) {
  if (hours <= 0) {
    return "0h";
  }
  if (hours < 24) {
    return `${Math.round(hours)}h`;
  }
  const days = hours / 24;
  return `${days.toFixed(1)}d`;
}

function extractErrorMessage(body: unknown) {
  if (!body) {
    return "원인을 확인할 수 없습니다.";
  }
  if (typeof body === "string") {
    return body;
  }
  if (typeof body !== "object" || Array.isArray(body)) {
    return String(body);
  }

  const candidateKeys = ["error", "message", "reason", "detail"];
  for (const key of candidateKeys) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return JSON.stringify(body);
}

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

function formatDiffKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  const abs = Math.abs(value).toLocaleString("ko-KR");
  if (value > 0) {
    return `+${abs}원`;
  }
  if (value < 0) {
    return `-${abs}원`;
  }
  return "0원";
}

function formatPercent(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toFixed(1)}%`;
}

function formatDateOnly(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("ko-KR");
}

function formatMonthLabel(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return `${parsed.getFullYear()}년 ${String(parsed.getMonth() + 1).padStart(2, "0")}월`;
}

const DEDUCTION_DESCRIPTION_MAP: Record<string, { label: string; description: string }> = {
  withholdingTaxKrw: {
    label: "원천세",
    description: "소득세와 지방소득세를 합산한 원천징수 금액입니다."
  },
  socialInsuranceKrw: {
    label: "사회보험",
    description: "국민연금, 건강보험, 장기요양, 고용보험 근로자 부담분입니다."
  },
  otherDeductionsKrw: {
    label: "기타 공제",
    description: "회사 정책에 따른 추가 공제(가불금/기타 정산) 금액입니다."
  },
  incomeTaxKrw: {
    label: "소득세",
    description: "과세표준 기준으로 계산된 월 소득세입니다."
  },
  localIncomeTaxKrw: {
    label: "지방소득세",
    description: "소득세 연동 지방세 항목입니다."
  },
  nationalPensionKrw: {
    label: "국민연금",
    description: "국민연금 근로자 부담분입니다."
  },
  healthInsuranceKrw: {
    label: "건강보험",
    description: "건강보험 근로자 부담분입니다."
  },
  longTermCareKrw: {
    label: "장기요양",
    description: "건강보험 연동 장기요양보험 부담분입니다."
  },
  employmentInsuranceKrw: {
    label: "고용보험",
    description: "고용보험 근로자 부담분입니다."
  },
  preCreditIncomeTaxKrw: {
    label: "세액공제 전 소득세",
    description: "추가 세액공제 적용 전 계산된 소득세입니다."
  },
  dependentTaxCreditKrw: {
    label: "부양가족 공제",
    description: "부양가족 기준에 따라 적용된 세액공제입니다."
  },
  additionalTaxCreditKrw: {
    label: "추가 세액공제",
    description: "정책/요건 기반으로 적용된 추가 세액공제입니다."
  },
  totalTaxCreditKrw: {
    label: "총 세액공제",
    description: "모든 세액공제를 합산한 금액입니다."
  }
};

export default function EmployeePayslipsPage() {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [runs, setRuns] = useState<PayrollRunDto[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [compareRunId, setCompareRunId] = useState("");
  const [payslipSearchScope, setPayslipSearchScope] = useState<PayslipSearchScope>("all");
  const [payslipSearchQuery, setPayslipSearchQuery] = useState("");
  const [payslipSortOption, setPayslipSortOption] = useState<PayslipSortOption>("latest_desc");
  const [aggregate, setAggregate] = useState<AttendanceAggregateDto | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [mobileDeliveryChannel, setMobileDeliveryChannel] = useState<MobileDeliveryChannel>("kakao");
  const [mobileDeliveryState, setMobileDeliveryState] = useState<MobileDeliveryState>("idle");
  const [mobileDeliveryFeedback, setMobileDeliveryFeedback] = useState("");

  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
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

  const payslipSearchRows = useMemo<PayslipSearchRow[]>(() => {
    return runs.map((run) => {
      const confirmedAtTs = toTimestamp(run.confirmedAt);
      const periodEndTs = toTimestamp(run.periodEnd);
      return {
        key: run.id,
        runId: run.id,
        periodLabel: `${formatDateOnly(run.periodStart)} ~ ${formatDateOnly(run.periodEnd)}`,
        state: run.state,
        grossPayKrw: run.grossPayKrw,
        totalDeductionsKrw: run.totalDeductionsKrw,
        netPayKrw: run.netPayKrw,
        confirmedAt: run.confirmedAt,
        sortTimestamp: confirmedAtTs > 0 ? confirmedAtTs : periodEndTs
      };
    });
  }, [runs]);

  const filteredPayslipSearchRows = useMemo(() => {
    const filtered = payslipSearchRows.filter((row) =>
      matchesPayslipSearch(payslipSearchScope, normalizedPayslipSearchQuery, row)
    );

    return sortPayslipSearchRows(filtered, payslipSortOption);
  }, [normalizedPayslipSearchQuery, payslipSearchRows, payslipSearchScope, payslipSortOption]);

  const payslipHistorySortAccuracyCards = useMemo<PayslipHistorySortAccuracyCard[]>(() => {
    const scopedRows = payslipSearchRows.filter((row) =>
      matchesPayslipSearch(payslipSearchScope, normalizedPayslipSearchQuery, row)
    );
    const currentTopRows = sortPayslipSearchRows(scopedRows, payslipSortOption);
    const totalCompared = Math.min(10, currentTopRows.length);
    const currentTopKeys = new Set(currentTopRows.slice(0, totalCompared).map((row) => row.key));

    const toAccuracyCard = (
      key: string,
      label: string,
      baselineOption: PayslipSortOption
    ): PayslipHistorySortAccuracyCard => {
      if (totalCompared === 0) {
        return {
          key,
          label,
          severity: "normal",
          accuracyScore: 100,
          matchedCount: 0,
          totalCompared: 0,
          detail: "No payslip rows are available for current search/sort scope.",
          targetSectionId: "payslip-search-sort"
        };
      }

      const baselineTopRows = sortPayslipSearchRows(scopedRows, baselineOption).slice(0, totalCompared);
      const matchedCount = baselineTopRows.filter((row) => currentTopKeys.has(row.key)).length;
      const accuracyScore = Math.round((matchedCount / totalCompared) * 100);
      const severity: PayslipPredictionSeverity =
        accuracyScore < 50 ? "critical" : accuracyScore < 75 ? "watch" : "normal";

      return {
        key,
        label,
        severity,
        accuracyScore,
        matchedCount,
        totalCompared,
        detail: `Top ${matchedCount}/${totalCompared} rows match ${label.toLowerCase()}.`,
        targetSectionId: "payslip-search-sort"
      };
    };

    return [
      toAccuracyCard("latest", "latest-first baseline", "latest_desc"),
      toAccuracyCard("net", "net-pay baseline", "net_desc"),
      toAccuracyCard("gross", "gross-pay baseline", "gross_desc")
    ].sort((left, right) => {
      const severityDiff =
        payslipPredictionSeverityRank(right.severity) - payslipPredictionSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return left.accuracyScore - right.accuracyScore;
    });
  }, [normalizedPayslipSearchQuery, payslipSearchRows, payslipSearchScope, payslipSortOption]);

  const payslipHistorySortHardeningCards = useMemo<PayslipHistorySortHardeningCard[]>(() => {
    const cards = payslipHistorySortAccuracyCards.map((card) => {
      let searchScope: PayslipSearchScope = "all";
      let searchQuery = "";
      let recommendedSortOption: PayslipSortOption = "latest_desc";
      if (card.key === "net") {
        searchScope = "state";
        searchQuery = "confirmed";
        recommendedSortOption = "net_desc";
      } else if (card.key === "gross") {
        searchScope = "period";
        searchQuery = "";
        recommendedSortOption = "gross_desc";
      } else if (card.key === "latest") {
        recommendedSortOption = "latest_desc";
      }

      const confidenceGap = Math.max(0, 100 - card.accuracyScore);
      const alreadyAligned = payslipSortOption === recommendedSortOption;
      const responseLabel =
        card.totalCompared === 0
          ? "No rows in current search scope."
          : card.severity === "critical"
            ? `Apply ${payslipSortOptionLabel(recommendedSortOption)} and re-check top rows now.`
            : card.severity === "watch"
              ? `Apply ${payslipSortOptionLabel(recommendedSortOption)} and verify ordering confidence.`
              : alreadyAligned
                ? "Current sort option is already aligned."
                : `Switch to ${payslipSortOptionLabel(recommendedSortOption)} for stable ordering confidence.`;

      return {
        key: card.key,
        label: card.label,
        severity: card.severity,
        accuracyScore: card.accuracyScore,
        confidenceGap,
        totalCompared: card.totalCompared,
        responseLabel,
        detail:
          card.totalCompared === 0
            ? "No payslip rows are available for hardening."
            : `Accuracy ${card.accuracyScore} with confidence gap ${confidenceGap}.`,
        searchScope,
        searchQuery,
        recommendedSortOption,
        targetSectionId: "payslip-search-sort"
      };
    });

    return cards.sort((left, right) => {
      const severityDiff =
        payslipPredictionSeverityRank(right.severity) - payslipPredictionSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.confidenceGap - left.confidenceGap;
    });
  }, [payslipHistorySortAccuracyCards, payslipSortOption]);

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

  const statusFeedbackTone = useMemo(() => {
    if (!latestLog) {
      return "idle";
    }
    return latestLog.ok ? "ok" : "fail";
  }, [latestLog]);

  const statusFeedbackMessage = useMemo(() => {
    if (!latestLog) {
      return "최근 조회 결과가 없습니다.";
    }
    if (latestLog.ok) {
      return `${latestLog.label} 요청이 정상 처리되었습니다.`;
    }
    return `${latestLog.label} 요청이 실패했습니다.`;
  }, [latestLog]);

  const latestFailureMessage = useMemo(() => {
    if (!latestFailedLog) {
      return "";
    }
    return extractErrorMessage(latestFailedLog.body);
  }, [latestFailedLog]);

  const statusRecoveryGuide = useMemo(() => {
    if (!latestFailedLog) {
      return "실패 이력이 없으면 최신 명세서를 선택한 뒤 전달 준비를 진행하세요.";
    }
    return "실패 원인을 확인한 뒤 조회 기간/사번/조직 ID를 점검하고 다시 조회하세요.";
  }, [latestFailedLog]);

  const compareCandidates = useMemo(() => {
    if (!selectedRun) {
      return [];
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

  const compareMetrics = useMemo<CompareMetric[]>(() => {
    if (!selectedRun || !compareRun) {
      return [];
    }

    const rows: Array<{ id: string; label: string; selectedValue: number | null; compareValue: number | null }> = [
      {
        id: "gross",
        label: "총지급",
        selectedValue: selectedRun.grossPayKrw,
        compareValue: compareRun.grossPayKrw
      },
      {
        id: "deduction",
        label: "총공제",
        selectedValue: selectedRun.totalDeductionsKrw,
        compareValue: compareRun.totalDeductionsKrw
      },
      {
        id: "net",
        label: "실지급",
        selectedValue: selectedRun.netPayKrw,
        compareValue: compareRun.netPayKrw
      }
    ];

    return rows.map((row) => ({
      ...row,
      diffValue: safeDiff(row.selectedValue, row.compareValue),
      diffRate: safeDiffRate(row.selectedValue, row.compareValue)
    }));
  }, [compareRun, selectedRun]);

  const compareWindowLabel = useMemo(() => {
    if (!selectedRun || !compareRun) {
      return "-";
    }
    const selectedLabel = `${formatDateOnly(selectedRun.periodStart)} ~ ${formatDateOnly(selectedRun.periodEnd)}`;
    const compareLabel = `${formatDateOnly(compareRun.periodStart)} ~ ${formatDateOnly(compareRun.periodEnd)}`;
    return `${selectedLabel} vs ${compareLabel}`;
  }, [compareRun, selectedRun]);

  const mobileDeliveryStateLabel = useMemo(() => {
    if (mobileDeliveryState === "ready") {
      return "전달 준비 완료";
    }
    if (mobileDeliveryState === "sent") {
      return "전달 시뮬레이션 완료";
    }
    if (mobileDeliveryState === "failed") {
      return "전달 준비 실패";
    }
    return "대기";
  }, [mobileDeliveryState]);

  const payslipConfirmationPredictionCards = useMemo<PayslipConfirmationPredictionCard[]>(() => {
    const confirmedRuns = [...runs]
      .filter((run) => toTimestamp(run.confirmedAt) > 0)
      .sort((left, right) => toTimestamp(right.confirmedAt) - toTimestamp(left.confirmedAt));

    const confirmedIntervalsHours: number[] = [];
    for (let index = 0; index < confirmedRuns.length - 1; index += 1) {
      const currentMs = toTimestamp(confirmedRuns[index].confirmedAt);
      const nextMs = toTimestamp(confirmedRuns[index + 1].confirmedAt);
      if (currentMs > 0 && nextMs > 0 && currentMs > nextMs) {
        confirmedIntervalsHours.push((currentMs - nextMs) / 3_600_000);
      }
    }

    const averageIntervalHours =
      confirmedIntervalsHours.length > 0
        ? confirmedIntervalsHours.reduce((sum, value) => sum + value, 0) / confirmedIntervalsHours.length
        : 24 * 30;

    const lastConfirmedMs = toTimestamp(confirmedRuns[0]?.confirmedAt ?? null);
    const expectedNextMs = lastConfirmedMs > 0 ? lastConfirmedMs + averageIntervalHours * 3_600_000 : 0;
    const nowMs = Date.now();
    const overdueHours = expectedNextMs > 0 ? Math.max(0, (nowMs - expectedNextMs) / 3_600_000) : 0;
    const untilExpectedHours = expectedNextMs > 0 ? Math.max(0, (expectedNextMs - nowMs) / 3_600_000) : 0;
    const cadenceSeverity: PayslipPredictionSeverity =
      expectedNextMs === 0 ? "watch" : overdueHours >= 72 ? "critical" : overdueHours >= 24 ? "watch" : "normal";

    const deliverySeverity: PayslipPredictionSeverity =
      mobileDeliveryState === "failed"
        ? "critical"
        : latestFailedLog
          ? "watch"
          : mobileDeliveryState === "sent"
            ? "normal"
            : "watch";

    const selectedSeverity: PayslipPredictionSeverity = selectedRun ? "normal" : "critical";
    const selectedEtaLabel = selectedRun ? "confirmed data selected" : "selection required";
    const selectedDetail = selectedRun
      ? `Selected run ${selectedRun.id} / confirmed ${formatDateTime(selectedRun.confirmedAt)}`
      : "No selected payslip. Choose one from search/sort list to continue.";

    const cadenceEtaLabel =
      expectedNextMs === 0
        ? "insufficient history"
        : overdueHours > 0
          ? `${formatHourDistanceLabel(overdueHours)} overdue`
          : `${formatHourDistanceLabel(untilExpectedHours)} remaining`;

    const cards: PayslipConfirmationPredictionCard[] = [
      {
        key: "selected-confirmed-run",
        label: "selected confirmed run",
        severity: selectedSeverity,
        etaLabel: selectedEtaLabel,
        detail: selectedDetail,
        metricLabel: `confirmed list ${confirmedRuns.length}`,
        targetSectionId: "payslip-search-sort"
      },
      {
        key: "next-confirmation-cadence",
        label: "next confirmation cadence",
        severity: cadenceSeverity,
        etaLabel: cadenceEtaLabel,
        detail:
          expectedNextMs === 0
            ? "Need at least one confirmed history item for cadence prediction."
            : `avg interval ${formatHourDistanceLabel(averageIntervalHours)} / last confirmed ${formatDateTime(confirmedRuns[0]?.confirmedAt ?? null)}`,
        metricLabel: `interval samples ${confirmedIntervalsHours.length}`,
        targetSectionId: "status-feedback"
      },
      {
        key: "mobile-delivery-readiness",
        label: "mobile delivery readiness",
        severity: deliverySeverity,
        etaLabel: mobileDeliveryStateLabel,
        detail:
          mobileDeliveryState === "sent"
            ? "Delivery simulation has completed. You can move to print/download."
            : mobileDeliveryState === "failed"
              ? "Delivery flow is blocked. Resolve latest failure and retry."
              : latestFailedLog
                ? "There is a recent failure log. Verify the cause before sending."
                : "Prepare delivery channel and run simulation when ready.",
        metricLabel: `failure logs ${logs.filter((log) => !log.ok).length}`,
        targetSectionId: "mobile-delivery"
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff = payslipPredictionSeverityRank(right.severity) - payslipPredictionSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return left.label.localeCompare(right.label);
    });
  }, [latestFailedLog, logs, mobileDeliveryState, mobileDeliveryStateLabel, runs, selectedRun]);

  const payslipDelayRiskPredictionCards = useMemo<PayslipDelayRiskPredictionCard[]>(() => {
    const nowMs = Date.now();
    const dayMs = 86_400_000;

    const toRiskCard = (input: {
      key: string;
      label: string;
      rows: PayslipSearchRow[];
      targetSectionId: string;
      emptySeverity?: PayslipPredictionSeverity;
      emptyDetail?: string;
    }): PayslipDelayRiskPredictionCard => {
      const rowCount = input.rows.length;
      if (rowCount === 0) {
        const severity = input.emptySeverity ?? "normal";
        return {
          key: input.key,
          label: input.label,
          severity,
          riskScore: severity === "critical" ? 95 : severity === "watch" ? 55 : 0,
          rowCount: 0,
          watchCount: 0,
          criticalCount: 0,
          averageAgeDays: 0,
          maxAgeDays: 0,
          etaLabel: severity === "critical" ? "act now" : severity === "watch" ? "check filters" : "stable",
          detail: input.emptyDetail ?? "No rows in current scope.",
          targetSectionId: input.targetSectionId
        };
      }

      const ageDaysValues = input.rows.map((row) => Math.max(0, (nowMs - row.sortTimestamp) / dayMs));
      const watchCount = ageDaysValues.filter((value) => value >= 35).length;
      const criticalCount = ageDaysValues.filter((value) => value >= 45).length;
      const totalAgeDays = ageDaysValues.reduce((sum, value) => sum + value, 0);
      const averageAgeDays = totalAgeDays / rowCount;
      const maxAgeDays = Math.max(...ageDaysValues);
      const rawRiskScore = averageAgeDays * 1.4 + maxAgeDays * 1.1 + watchCount * 8 + criticalCount * 16;
      const riskScore = Math.min(100, Math.round(rawRiskScore));
      const severity: PayslipPredictionSeverity =
        criticalCount > 0 || riskScore >= 80 ? "critical" : watchCount > 0 || riskScore >= 45 ? "watch" : "normal";
      const etaLabel =
        severity === "critical"
          ? "act now"
          : severity === "watch"
            ? "within 1 business day"
            : "within today";

      return {
        key: input.key,
        label: input.label,
        severity,
        riskScore,
        rowCount,
        watchCount,
        criticalCount,
        averageAgeDays,
        maxAgeDays,
        etaLabel,
        detail: `risk ${riskScore} / avg ${averageAgeDays.toFixed(1)}d / max ${maxAgeDays.toFixed(1)}d`,
        targetSectionId: input.targetSectionId
      };
    };

    const hasSearchQuery = normalizedPayslipSearchQuery.length > 0;
    const selectionRiskCard: PayslipDelayRiskPredictionCard = selectedRun
      ? {
          key: "selected-run-delivery",
          label: "selected run delivery handoff",
          severity:
            mobileDeliveryState === "failed"
              ? "critical"
              : latestFailedLog
                ? "watch"
                : mobileDeliveryState === "sent"
                  ? "normal"
                  : "watch",
          riskScore:
            mobileDeliveryState === "failed"
              ? 95
              : latestFailedLog
                ? 70
                : mobileDeliveryState === "sent"
                  ? 10
                  : 55,
          rowCount: 1,
          watchCount: mobileDeliveryState === "sent" ? 0 : 1,
          criticalCount: mobileDeliveryState === "failed" ? 1 : 0,
          averageAgeDays: 0,
          maxAgeDays: 0,
          etaLabel:
            mobileDeliveryState === "failed"
              ? "act now"
              : mobileDeliveryState === "sent"
                ? "completed"
                : "prepare delivery",
          detail:
            mobileDeliveryState === "failed"
              ? "Delivery flow failed. Resolve latest issue before handoff."
              : mobileDeliveryState === "sent"
                ? "Delivery simulation is completed for selected run."
                : "Selected run is ready, but delivery simulation is not completed yet.",
          targetSectionId: "mobile-delivery"
        }
      : {
          key: "selected-run-delivery",
          label: "selected run delivery handoff",
          severity: "critical",
          riskScore: 90,
          rowCount: 0,
          watchCount: 0,
          criticalCount: 1,
          averageAgeDays: 0,
          maxAgeDays: 0,
          etaLabel: "selection required",
          detail: "No selected run. Pick a confirmed payslip to continue delivery handoff.",
          targetSectionId: "payslip-search-sort"
        };

    return [
      toRiskCard({
        key: "all-confirmed-history",
        label: "all confirmed history",
        rows: payslipSearchRows,
        targetSectionId: "payslip-search-sort",
        emptySeverity: "watch",
        emptyDetail: "No confirmed payslips are loaded for the selected period."
      }),
      toRiskCard({
        key: "active-search-scope",
        label: "active search scope",
        rows: filteredPayslipSearchRows,
        targetSectionId: "payslip-search-sort",
        emptySeverity: hasSearchQuery ? "watch" : "normal",
        emptyDetail: hasSearchQuery
          ? "Current query returns no rows. Broaden filters before payout follow-up."
          : "Search scope is clear."
      }),
      selectionRiskCard
    ].sort((left, right) => {
      const severityDiff =
        payslipPredictionSeverityRank(right.severity) - payslipPredictionSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.riskScore - left.riskScore;
    });
  }, [
    filteredPayslipSearchRows,
    latestFailedLog,
    mobileDeliveryState,
    normalizedPayslipSearchQuery,
    payslipSearchRows,
    selectedRun
  ]);

  const payslipDelayRiskResponseCards = useMemo<PayslipDelayRiskResponseCard[]>(() => {
    const cards = payslipDelayRiskPredictionCards.map((card) => {
      let searchScope: PayslipSearchScope = "all";
      let searchQuery = "";
      let recommendedSortOption: PayslipSortOption = "oldest_asc";
      let targetSectionId = "payslip-search-sort";
      let responseLabel = "Open confirmed history and process oldest payout records first.";

      if (card.key === "active-search-scope") {
        searchScope = "state";
        searchQuery = "confirmed";
        responseLabel = "Reset search scope and process backlog-sensitive rows first.";
      } else if (card.key === "selected-run-delivery") {
        searchScope = "run_id";
        searchQuery = selectedRun?.id ?? "";
        recommendedSortOption = "latest_desc";
        targetSectionId = "mobile-delivery";
        responseLabel = "Confirm selected run handoff and close delivery simulation blockers.";
      }

      const responseWindow =
        card.rowCount === 0
          ? "monitor daily"
          : card.severity === "critical"
            ? "within 2h"
            : card.severity === "watch"
              ? "within 8h"
              : "within 24h";

      return {
        key: card.key,
        label: card.label,
        severity: card.severity,
        rowCount: card.rowCount,
        watchCount: card.watchCount,
        criticalCount: card.criticalCount,
        riskScore: card.riskScore,
        responseWindow,
        responseLabel,
        detail:
          card.rowCount === 0
            ? "No rows available for delay-risk response."
            : `Respond ${responseWindow}: risk ${card.riskScore}, watch ${card.watchCount}, critical ${card.criticalCount}.`,
        searchScope,
        searchQuery,
        recommendedSortOption,
        targetSectionId
      };
    });

    return cards.sort((left, right) => {
      const severityDiff =
        payslipPredictionSeverityRank(right.severity) - payslipPredictionSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      const riskDiff = right.riskScore - left.riskScore;
      if (riskDiff !== 0) {
        return riskDiff;
      }
      return right.rowCount - left.rowCount;
    });
  }, [payslipDelayRiskPredictionCards, selectedRun?.id]);

  const payslipMobileFollowUpCards = useMemo<PayslipMobileFollowUpCard[]>(() => {
    const highestPredictionTone = payslipPredictionToneFromSeverity(
      payslipConfirmationPredictionCards[0]?.severity ?? "normal"
    );

    return [
      {
        key: "search-sort-follow-up",
        label: "search and sort follow-up",
        tone: filteredPayslipSearchRows.length > 0 ? "ready" : "pending",
        detail:
          filteredPayslipSearchRows.length > 0
            ? `${filteredPayslipSearchRows.length} payslip row(s) match current options.`
            : "No rows match current search options. Reset filters and search again.",
        ctaLabel: "open search/sort",
        action: "jump",
        targetSectionId: "payslip-search-sort"
      },
      {
        key: "confirmation-prediction-follow-up",
        label: "confirmation prediction follow-up",
        tone: highestPredictionTone,
        detail:
          payslipConfirmationPredictionCards[0]?.detail ??
          "Review confirmation prediction feedback and follow related action.",
        ctaLabel: "open prediction",
        action: "jump",
        targetSectionId: "payslip-confirmation-prediction"
      },
      {
        key: "mobile-delivery-prepare",
        label: "prepare mobile delivery",
        tone: mobileDeliveryState === "ready" || mobileDeliveryState === "sent" ? "ready" : "pending",
        detail:
          selectedRun && (mobileDeliveryState === "idle" || mobileDeliveryState === "failed")
            ? "Prepare channel to continue mobile delivery simulation."
            : "Mobile delivery channel is already prepared or completed.",
        ctaLabel: "prepare now",
        action: "prepare_delivery",
        targetSectionId: "mobile-delivery"
      },
      {
        key: "latest-failure-follow-up",
        label: "latest failure follow-up",
        tone: latestFailedLog ? "fail" : "ready",
        detail: latestFailedLog
          ? `Latest failure: ${extractErrorMessage(latestFailedLog.body)}`
          : "No recent failure. Keep the latest status snapshot for delivery traceability.",
        ctaLabel: latestFailedLog ? "copy failure cause" : "open status",
        action: latestFailedLog ? "copy_failure" : "jump",
        targetSectionId: "status-feedback"
      },
      {
        key: "send-simulation-follow-up",
        label: "send simulation follow-up",
        tone:
          mobileDeliveryState === "ready"
            ? "ready"
            : mobileDeliveryState === "failed" || !selectedRun
              ? "fail"
              : "pending",
        detail:
          mobileDeliveryState === "ready"
            ? "Run delivery simulation to validate final handoff."
            : mobileDeliveryState === "sent"
              ? "Simulation already completed. Export/print the payslip document."
              : "Prepare delivery first, then retry simulation.",
        ctaLabel: "run simulation",
        action: "send_simulation",
        targetSectionId: "mobile-delivery"
      }
    ];
  }, [
    filteredPayslipSearchRows.length,
    latestFailedLog,
    mobileDeliveryState,
    payslipConfirmationPredictionCards,
    selectedRun
  ]);

  const payslipMobileFollowUpRecommendationCards = useMemo<PayslipMobileFollowUpRecommendationCard[]>(() => {
    const topSortAccuracyRisk = payslipHistorySortAccuracyCards[0];
    const topDelayRisk = payslipDelayRiskPredictionCards[0];
    const hasSortAccuracyRisk =
      topSortAccuracyRisk &&
      topSortAccuracyRisk.totalCompared > 0 &&
      topSortAccuracyRisk.severity !== "normal";
    const hasDelayRisk = topDelayRisk && topDelayRisk.rowCount > 0 && topDelayRisk.severity !== "normal";
    const hasSearchQuery = normalizedPayslipSearchQuery.length > 0;
    const hasSearchResults = filteredPayslipSearchRows.length > 0;

    const deliveryRecommendation = latestFailedLog
      ? {
          severity: "critical" as const,
          detail: `Latest failure: ${extractErrorMessage(latestFailedLog.body)}`,
          ctaLabel: "copy failure cause",
          action: "copy_failure" as const,
          targetSectionId: "status-feedback"
        }
      : !selectedRun
        ? {
            severity: "watch" as const,
            detail: "Select a confirmed payslip first, then continue delivery handoff.",
            ctaLabel: "open search/sort",
            action: "jump" as const,
            targetSectionId: "payslip-search-sort"
          }
        : mobileDeliveryState === "ready"
          ? {
              severity: "watch" as const,
              detail: "Delivery channel is prepared. Run simulation to close payout handoff.",
              ctaLabel: "run simulation",
              action: "send_simulation" as const,
              targetSectionId: "mobile-delivery"
            }
          : mobileDeliveryState === "sent"
            ? {
                severity: "normal" as const,
                detail: "Delivery simulation is completed. Continue with print/export if needed.",
                ctaLabel: "open delivery",
                action: "jump" as const,
                targetSectionId: "mobile-delivery"
              }
            : {
                severity: "watch" as const,
                detail: "Delivery is not prepared yet. Prepare channel before simulation.",
                ctaLabel: "prepare delivery",
                action: "prepare_delivery" as const,
                targetSectionId: "mobile-delivery"
              };

    return [
      {
        key: "sort-accuracy-follow-up",
        label: "history sort accuracy follow-up",
        severity: hasSortAccuracyRisk ? topSortAccuracyRisk?.severity ?? "watch" : "normal",
        detail: hasSortAccuracyRisk
          ? topSortAccuracyRisk?.detail ?? "Review history sort-accuracy cards."
          : "Current history sort accuracy is stable.",
        ctaLabel: "open sort accuracy",
        action: "jump",
        targetSectionId: "payslip-history-sort-accuracy"
      },
      {
        key: "delay-risk-follow-up",
        label: "payout delay risk follow-up",
        severity: hasDelayRisk ? topDelayRisk?.severity ?? "watch" : "normal",
        detail: hasDelayRisk ? topDelayRisk?.detail ?? "Review delay-risk cards." : "No immediate payout delay risk.",
        ctaLabel: "open delay risk",
        action: "jump",
        targetSectionId: "payslip-delay-risk-prediction"
      },
      {
        key: "search-execution-follow-up",
        label: "search/sort execution follow-up",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset scope or broaden query."
            : `${filteredPayslipSearchRows.length} row(s) are ready for follow-up.`,
        ctaLabel: "open search/sort",
        action: "jump",
        targetSectionId: "payslip-search-sort"
      },
      {
        key: "delivery-handoff-follow-up",
        label: "delivery handoff follow-up",
        severity: deliveryRecommendation.severity,
        detail: deliveryRecommendation.detail,
        ctaLabel: deliveryRecommendation.ctaLabel,
        action: deliveryRecommendation.action,
        targetSectionId: deliveryRecommendation.targetSectionId
      }
    ];
  }, [
    filteredPayslipSearchRows.length,
    latestFailedLog,
    mobileDeliveryState,
    normalizedPayslipSearchQuery.length,
    payslipDelayRiskPredictionCards,
    payslipHistorySortAccuracyCards,
    selectedRun
  ]);

  const payslipMobileFollowUpRecommendationUpgradeCards = useMemo<
    PayslipMobileFollowUpRecommendationUpgradeCard[]
  >(() => {
    const topSortHardeningRisk = payslipHistorySortHardeningCards.find(
      (card) => card.totalCompared > 0 && card.severity !== "normal"
    );
    const topDelayResponseRisk = payslipDelayRiskResponseCards.find(
      (card) => card.rowCount > 0 && card.severity !== "normal"
    );
    const hasSearchQuery = normalizedPayslipSearchQuery.length > 0;
    const hasSearchResults = filteredPayslipSearchRows.length > 0;

    const deliveryUpgrade = latestFailedLog
      ? {
          severity: "critical" as const,
          priorityScore: 100,
          detail: `Latest failure: ${extractErrorMessage(latestFailedLog.body)}`,
          ctaLabel: "copy failure cause",
          action: "copy_failure" as const,
          targetSectionId: "status-feedback"
        }
      : !selectedRun
        ? {
            severity: "watch" as const,
            priorityScore: 86,
            detail: "Select a confirmed payslip first, then continue delivery handoff.",
            ctaLabel: "open search/sort",
            action: "jump" as const,
            targetSectionId: "payslip-search-sort"
          }
        : mobileDeliveryState === "ready"
          ? {
              severity: "watch" as const,
              priorityScore: 78,
              detail: "Delivery channel is prepared. Run simulation to close payout handoff.",
              ctaLabel: "run simulation",
              action: "send_simulation" as const,
              targetSectionId: "mobile-delivery"
            }
          : mobileDeliveryState === "sent"
            ? {
                severity: "normal" as const,
                priorityScore: 34,
                detail: "Delivery simulation is completed. Continue with print/export if needed.",
                ctaLabel: "open delivery",
                action: "jump" as const,
                targetSectionId: "mobile-delivery"
              }
            : {
                severity: "watch" as const,
                priorityScore: 70,
                detail: "Delivery is not prepared yet. Prepare channel before simulation.",
                ctaLabel: "prepare delivery",
                action: "prepare_delivery" as const,
                targetSectionId: "mobile-delivery"
              };

    const cards: PayslipMobileFollowUpRecommendationUpgradeCard[] = [
      {
        key: "sort-hardening",
        label: "history sort hardening upgrade",
        severity: topSortHardeningRisk?.severity ?? "normal",
        priorityScore: topSortHardeningRisk?.confidenceGap ?? 18,
        detail: topSortHardeningRisk
          ? topSortHardeningRisk.responseLabel
          : "Current history sort confidence is stable.",
        ctaLabel: "apply hardening",
        action: "jump",
        targetSectionId: "payslip-history-sort-hardening"
      },
      {
        key: "delay-response",
        label: "payout delay risk response upgrade",
        severity: topDelayResponseRisk?.severity ?? "normal",
        priorityScore: topDelayResponseRisk?.riskScore ?? 24,
        detail: topDelayResponseRisk
          ? `${topDelayResponseRisk.responseLabel} (${topDelayResponseRisk.responseWindow})`
          : "No immediate payout delay response is required.",
        ctaLabel: "run response",
        action: "jump",
        targetSectionId: "payslip-delay-risk-response"
      },
      {
        key: "search-execution-upgrade",
        label: "search/sort execution upgrade",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        priorityScore: hasSearchQuery && !hasSearchResults ? 64 : 28,
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Broaden scope before payout follow-up."
            : `${filteredPayslipSearchRows.length} row(s) are ready for follow-up execution.`,
        ctaLabel: "open search/sort",
        action: "jump",
        targetSectionId: "payslip-search-sort"
      },
      {
        key: "delivery-handoff-upgrade",
        label: "delivery handoff upgrade",
        severity: deliveryUpgrade.severity,
        priorityScore: deliveryUpgrade.priorityScore,
        detail: deliveryUpgrade.detail,
        ctaLabel: deliveryUpgrade.ctaLabel,
        action: deliveryUpgrade.action,
        targetSectionId: deliveryUpgrade.targetSectionId
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff =
        payslipPredictionSeverityRank(right.severity) - payslipPredictionSeverityRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.priorityScore - left.priorityScore;
    });
  }, [
    filteredPayslipSearchRows.length,
    latestFailedLog,
    mobileDeliveryState,
    normalizedPayslipSearchQuery.length,
    payslipDelayRiskResponseCards,
    payslipHistorySortHardeningCards,
    selectedRun
  ]);

  const fixedDeductionExplainItems = useMemo<DeductionExplainItem[]>(() => {
    if (!selectedRun) {
      return [];
    }
    return [
      {
        key: "withholdingTaxKrw",
        label: DEDUCTION_DESCRIPTION_MAP.withholdingTaxKrw.label,
        amountKrw: selectedRun.withholdingTaxKrw,
        description: DEDUCTION_DESCRIPTION_MAP.withholdingTaxKrw.description
      },
      {
        key: "socialInsuranceKrw",
        label: DEDUCTION_DESCRIPTION_MAP.socialInsuranceKrw.label,
        amountKrw: selectedRun.socialInsuranceKrw,
        description: DEDUCTION_DESCRIPTION_MAP.socialInsuranceKrw.description
      },
      {
        key: "otherDeductionsKrw",
        label: DEDUCTION_DESCRIPTION_MAP.otherDeductionsKrw.label,
        amountKrw: selectedRun.otherDeductionsKrw,
        description: DEDUCTION_DESCRIPTION_MAP.otherDeductionsKrw.description
      }
    ];
  }, [selectedRun]);

  const componentDeductionExplainItems = useMemo<DeductionExplainItem[]>(() => {
    const additional = toBreakdownRecord(selectedRunBreakdown?.additional ?? null);
    const components = toBreakdownRecord(additional?.components ?? null);
    if (!components) {
      return [];
    }

    return Object.entries(components).flatMap(([key, value]) => {
      const amount = toNumberOrNull(value);
      if (amount === null || amount === 0) {
        return [];
      }
      const mapped = DEDUCTION_DESCRIPTION_MAP[key];
      return [
        {
          key,
          label: mapped?.label ?? key,
          amountKrw: amount,
          description: mapped?.description ?? "법정공제 세부 항목입니다."
        }
      ];
    });
  }, [selectedRunBreakdown]);

  const taxCreditExplainItems = useMemo<DeductionExplainItem[]>(() => {
    const additional = toBreakdownRecord(selectedRunBreakdown?.additional ?? null);
    const taxCredits = toBreakdownRecord(additional?.taxCreditsKrw ?? null);
    if (!taxCredits) {
      return [];
    }

    return ["preCreditIncomeTaxKrw", "dependentTaxCreditKrw", "additionalTaxCreditKrw", "totalTaxCreditKrw"].flatMap(
      (key) => {
        const amount = toNumberOrNull(taxCredits[key]);
        if (amount === null || amount === 0) {
          return [];
        }
        const mapped = DEDUCTION_DESCRIPTION_MAP[key];
        return [
          {
            key,
            label: mapped?.label ?? key,
            amountKrw: amount,
            description: mapped?.description ?? "세액공제 계산에 사용된 항목입니다."
          }
        ];
      }
    );
  }, [selectedRunBreakdown]);

  const deductionExplainSections = useMemo<DeductionExplainSection[]>(() => {
    if (!selectedRun) {
      return [];
    }
    return [
      {
        id: "fixed",
        title: "공제 항목 설명",
        items: fixedDeductionExplainItems
      },
      {
        id: "component",
        title: "법정공제 세부 구성",
        items: componentDeductionExplainItems
      },
      {
        id: "tax-credit",
        title: "세액공제 참고 항목",
        items: taxCreditExplainItems
      }
    ];
  }, [componentDeductionExplainItems, fixedDeductionExplainItems, selectedRun, taxCreditExplainItems]);

  const payslipFileName = useMemo(() => {
    if (!selectedRun) {
      return "";
    }
    const period = new Date(selectedRun.periodStart);
    const year = Number.isNaN(period.getTime()) ? "unknown" : String(period.getFullYear());
    const month = Number.isNaN(period.getTime()) ? "00" : String(period.getMonth() + 1).padStart(2, "0");
    const actor = (selectedRun.employeeId ?? employeeId ?? "employee").replace(/\s+/g, "-");
    return `flowhr-payslip-${actor}-${year}${month}.pdf`;
  }, [employeeId, selectedRun]);

  useEffect(() => {
    if (runs.length === 0) {
      setSelectedRunId("");
      return;
    }
    if (!runs.some((run) => run.id === selectedRunId)) {
      setSelectedRunId(runs[0].id);
    }
  }, [runs, selectedRunId]);

  useEffect(() => {
    if (compareCandidates.length === 0) {
      setCompareRunId("");
      return;
    }
    if (!compareCandidates.some((run) => run.id === compareRunId)) {
      setCompareRunId(compareCandidates[0].id);
    }
  }, [compareCandidates, compareRunId]);

  useEffect(() => {
    setMobileDeliveryState("idle");
    setMobileDeliveryFeedback("");
  }, [selectedRun?.id]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0 && !organizationId.trim()) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    const actorId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "").trim();
    if (actorId.length > 0 && employeeId.trim() !== actorId) {
      setEmployeeId(actorId);
    }
  }, [employeeId, isProductionRuntime, setEmployeeId, supabaseSession?.actorId, supabaseSession?.userId]);

  async function callApi(
    label: string,
    method: "GET" | "POST",
    path: string,
    payload?: Record<string, unknown>
  ) {
    setPendingLabel(label);
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }

      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken.trim()}`;
      } else {
        headers["x-actor-role"] = "employee";
        headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
        if (organizationId.trim().length > 0) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim().length > 0) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR"),
          body
        },
        ...prev
      ]);

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  async function refreshPayslips() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const targetEmployeeId = employeeId.trim() || "EMP-1001";

    const [runsRes, aggregateRes] = await Promise.all([
      callApi(
        "급여 명세서 조회",
        "GET",
        `/api/payroll/runs${buildQuery({
          from,
          to,
          employeeId: targetEmployeeId,
          state: "CONFIRMED"
        })}`
      ),
      callApi(
        "근태 집계 조회",
        "GET",
        `/api/attendance/aggregates${buildQuery({ from, to, employeeId: targetEmployeeId })}`
      )
    ]);

    if (runsRes.response.ok) {
      const parsed = runsRes.body as { runs?: PayrollRunDto[] };
      setRuns(Array.isArray(parsed.runs) ? parsed.runs : []);
    }

    if (aggregateRes.response.ok) {
      const parsed = aggregateRes.body as { aggregates?: AttendanceAggregateDto[] };
      const aggregates = Array.isArray(parsed.aggregates) ? parsed.aggregates : [];
      setAggregate(aggregates[0] ?? null);
    }
  }

  function applyCurrentMonthRange() {
    setPeriodStart(firstDayOfMonthLocal());
    setPeriodEnd(lastDayOfMonthLocal());
  }

  function applyPreviousMonthRange() {
    const range = previousMonthRangeLocal();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  function applyLastThreeMonthsRange() {
    const range = lastThreeMonthsRangeLocal();
    setPeriodStart(range.start);
    setPeriodEnd(range.end);
  }

  async function copySelectedRunId() {
    if (!selectedRun) {
      return;
    }
    try {
      await navigator.clipboard.writeText(selectedRun.id);
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "명세서 ID 복사",
          status: 200,
          ok: true,
          at: new Date().toLocaleString("ko-KR"),
          body: { runId: selectedRun.id }
        },
        ...prev
      ]);
    } catch (error) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "명세서 ID 복사",
          status: 500,
          ok: false,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: error instanceof Error ? error.message : String(error) }
        },
        ...prev
      ]);
    }
  }

  async function copyPayslipFileName() {
    if (!payslipFileName) {
      return;
    }
    try {
      await navigator.clipboard.writeText(payslipFileName);
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "PDF 파일명 복사",
          status: 200,
          ok: true,
          at: new Date().toLocaleString("ko-KR"),
          body: { fileName: payslipFileName }
        },
        ...prev
      ]);
    } catch (error) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "PDF 파일명 복사",
          status: 500,
          ok: false,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: error instanceof Error ? error.message : String(error) }
        },
        ...prev
      ]);
    }
  }

  function appendClientLog(label: string, ok: boolean, status: number, body: unknown) {
    setLogs((prev) => [
      {
        id: Date.now(),
        label,
        status,
        ok,
        at: new Date().toLocaleString("ko-KR"),
        body
      },
      ...prev
    ]);
  }

  async function copyLatestFailureCause() {
    if (!latestFailedLog) {
      return;
    }
    const message = extractErrorMessage(latestFailedLog.body);
    try {
      await navigator.clipboard.writeText(message);
      appendClientLog("실패 원인 복사", true, 200, { message });
    } catch (error) {
      appendClientLog("실패 원인 복사", false, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function prepareMobileDelivery() {
    if (!selectedRun) {
      setMobileDeliveryState("failed");
      setMobileDeliveryFeedback("선택된 명세서가 없어 전달 준비를 시작할 수 없습니다.");
      appendClientLog("모바일 전달 준비", false, 400, {
        reason: "missing-selected-run"
      });
      return;
    }

    const latestFailureAt = latestFailedLog?.at ?? "-";
    setMobileDeliveryState("ready");
    setMobileDeliveryFeedback(
      `${mobileDeliveryChannel.toUpperCase()} 전달 채널 준비 완료. 최근 실패 이력 시각: ${latestFailureAt}`
    );
    appendClientLog("모바일 전달 준비", true, 200, {
      runId: selectedRun.id,
      channel: mobileDeliveryChannel
    });
  }

  function sendMobileDeliverySimulation() {
    if (!selectedRun) {
      setMobileDeliveryState("failed");
      setMobileDeliveryFeedback("명세서를 먼저 선택한 뒤 전달 시뮬레이션을 실행하세요.");
      appendClientLog("모바일 전달 시뮬레이션", false, 400, {
        reason: "missing-selected-run"
      });
      return;
    }
    if (mobileDeliveryState !== "ready") {
      setMobileDeliveryState("failed");
      setMobileDeliveryFeedback("전달 준비를 먼저 완료해야 시뮬레이션을 실행할 수 있습니다.");
      appendClientLog("모바일 전달 시뮬레이션", false, 409, {
        reason: "not-ready"
      });
      return;
    }

    setMobileDeliveryState("sent");
    setMobileDeliveryFeedback(
      `${mobileDeliveryChannel.toUpperCase()} 전달 시뮬레이션이 완료되었습니다. 파일명: ${payslipFileName || "-"}`
    );
    appendClientLog("모바일 전달 시뮬레이션", true, 200, {
      runId: selectedRun.id,
      channel: mobileDeliveryChannel,
      fileName: payslipFileName || null
    });
  }

  async function copyCompareSnapshot() {
    if (!selectedRun || !compareRun) {
      return;
    }

    const payload = {
      selectedRunId: selectedRun.id,
      compareRunId: compareRun.id,
      window: compareWindowLabel,
      metrics: compareMetrics.map((metric) => ({
        id: metric.id,
        diffValue: metric.diffValue,
        diffRate: metric.diffRate
      }))
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      appendClientLog("비교 스냅샷 복사", true, 200, payload);
    } catch (error) {
      appendClientLog("비교 스냅샷 복사", false, 500, {
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  function downloadRunsCsv() {
    if (runs.length === 0) {
      return;
    }
    const header = [
      "run_id",
      "employee_id",
      "period_start",
      "period_end",
      "gross_pay_krw",
      "withholding_tax_krw",
      "social_insurance_krw",
      "other_deductions_krw",
      "total_deductions_krw",
      "net_pay_krw",
      "confirmed_at"
    ];

    const rows = runs.map((run) => [
      run.id,
      run.employeeId ?? "",
      run.periodStart,
      run.periodEnd,
      String(run.grossPayKrw),
      String(run.withholdingTaxKrw ?? 0),
      String(run.socialInsuranceKrw ?? 0),
      String(run.otherDeductionsKrw ?? 0),
      String(run.totalDeductionsKrw ?? 0),
      String(run.netPayKrw ?? 0),
      run.confirmedAt ?? ""
    ]);

    const csv = [header, ...rows].map((cols) => cols.map((col) => escapeCsv(col)).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `flowhr-payslips-${employeeId || "employee"}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function clearLogs() {
    setLogs([]);
  }

  function jumpToSection(sectionId: string) {
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetPayslipSearchControls() {
    setPayslipSearchScope("all");
    setPayslipSearchQuery("");
    setPayslipSortOption("latest_desc");
  }

  function focusSelectedPayslipInSearch() {
    if (!selectedRun) {
      return;
    }
    setPayslipSearchScope("run_id");
    setPayslipSearchQuery(selectedRun.id);
    setPayslipSortOption("latest_desc");
  }

  function prioritizeNetPaySearchSort() {
    setPayslipSortOption("net_desc");
  }

  function applyPayslipSearchSortPreset(input: {
    scope: PayslipSearchScope;
    query: string;
    sortOption: PayslipSortOption;
    targetSectionId: string;
    feedback?: string;
  }) {
    setPayslipSearchScope(input.scope);
    setPayslipSearchQuery(input.query);
    setPayslipSortOption(input.sortOption);
    jumpToSection(input.targetSectionId);
    if (input.feedback) {
      appendClientLog("명세서 검색/정렬 프리셋 적용", true, 200, {
        scope: input.scope,
        query: input.query,
        sortOption: input.sortOption,
        feedback: input.feedback
      });
    }
  }

  function runPayslipHistorySortHardeningAction(card: PayslipHistorySortHardeningCard) {
    applyPayslipSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      sortOption: card.recommendedSortOption,
      targetSectionId: card.targetSectionId,
      feedback:
        card.totalCompared === 0
          ? "No payslip rows are available for sort hardening."
          : `Applied ${payslipSortOptionLabel(card.recommendedSortOption)} preset for sort hardening.`
    });
  }

  function runPayslipDelayRiskResponseAction(card: PayslipDelayRiskResponseCard) {
    applyPayslipSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      sortOption: card.recommendedSortOption,
      targetSectionId: card.targetSectionId,
      feedback:
        card.rowCount === 0
          ? "No rows are available for payout delay-risk response."
          : `Delay-risk response preset applied (${card.responseWindow}).`
    });
  }

  function runPayslipMobileFollowUpAction(card: PayslipMobileFollowUpCard) {
    if (card.action === "prepare_delivery") {
      prepareMobileDelivery();
      jumpToSection(card.targetSectionId);
      return;
    }
    if (card.action === "send_simulation") {
      sendMobileDeliverySimulation();
      jumpToSection(card.targetSectionId);
      return;
    }
    if (card.action === "copy_failure") {
      void copyLatestFailureCause();
      jumpToSection(card.targetSectionId);
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runPayslipMobileFollowUpRecommendationAction(card: PayslipMobileFollowUpRecommendationCard) {
    if (card.action === "prepare_delivery") {
      prepareMobileDelivery();
      jumpToSection(card.targetSectionId);
      return;
    }
    if (card.action === "send_simulation") {
      sendMobileDeliverySimulation();
      jumpToSection(card.targetSectionId);
      return;
    }
    if (card.action === "copy_failure") {
      void copyLatestFailureCause();
      jumpToSection(card.targetSectionId);
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runPayslipMobileFollowUpRecommendationUpgradeAction(
    card: PayslipMobileFollowUpRecommendationUpgradeCard
  ) {
    if (card.key === "sort-hardening") {
      const sortHardeningTarget = payslipHistorySortHardeningCards.find(
        (hardeningCard) => hardeningCard.totalCompared > 0 && hardeningCard.severity !== "normal"
      );
      if (sortHardeningTarget) {
        runPayslipHistorySortHardeningAction(sortHardeningTarget);
        jumpToSection("payslip-history-sort-hardening");
        return;
      }
    }
    if (card.key === "delay-response") {
      const delayResponseTarget = payslipDelayRiskResponseCards.find(
        (responseCard) => responseCard.rowCount > 0 && responseCard.severity !== "normal"
      );
      if (delayResponseTarget) {
        runPayslipDelayRiskResponseAction(delayResponseTarget);
        jumpToSection("payslip-delay-risk-response");
        return;
      }
    }
    if (card.action === "prepare_delivery") {
      prepareMobileDelivery();
      jumpToSection(card.targetSectionId);
      return;
    }
    if (card.action === "send_simulation") {
      sendMobileDeliverySimulation();
      jumpToSection(card.targetSectionId);
      return;
    }
    if (card.action === "copy_failure") {
      void copyLatestFailureCause();
      jumpToSection(card.targetSectionId);
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">급여 명세서</h1>
          <p className="page-subtitle">직원은 본인의 확정된 급여 내역만 조회할 수 있습니다.</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/employee">
            직원 포털
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
          <Link className="btn btn-secondary" href="/admin">
            관리자
          </Link>
          <Link className="btn btn-secondary" href="/">
            홈
          </Link>
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          현재 환경은 <strong>production</strong>입니다. 명세서 조회를 위해 로그인 세션(Bearer)이 필요합니다:{" "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>명세서 건수</p>
          <strong>{payslipStats.count}</strong>
        </article>
        <article className="kpi-card">
          <p>총지급 합계</p>
          <strong>{formatKrw(payslipStats.totalGross)}</strong>
        </article>
        <article className="kpi-card">
          <p>총공제 합계</p>
          <strong>{formatKrw(payslipStats.totalDeductions)}</strong>
        </article>
        <article className="kpi-card">
          <p>실지급 합계</p>
          <strong>{formatKrw(payslipStats.totalNet)}</strong>
        </article>
        <article className="kpi-card">
          <p>API 호출</p>
          <strong>
            {stats.total} (OK {stats.success} / FAIL {stats.fail})
          </strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel">
          <h2>조회 조건</h2>
          <div className="input-grid">
            <label>
              Organization ID (선택)
              <input
                value={organizationId}
                placeholder="예: ORG-00001"
                onChange={(event) => setOrganizationId(event.target.value)}
              />
            </label>
            <label>
              내 직원 ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              기간 시작
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              기간 종료
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void refreshPayslips()}>
              조회
            </button>
            <button className="btn btn-secondary" onClick={applyCurrentMonthRange}>
              이번 달
            </button>
            <button className="btn btn-secondary" onClick={applyPreviousMonthRange}>
              지난 달
            </button>
            <button className="btn btn-secondary" onClick={applyLastThreeMonthsRange}>
              최근 3개월
            </button>
            <button className="btn btn-secondary" onClick={downloadRunsCsv} disabled={runs.length === 0}>
              CSV 다운로드
            </button>
          </div>

          {showDevTools ? (
            <details className="details" style={{ marginTop: 12 }}>
              <summary>
                개발/검증 설정 <small>(기본은 숨김)</small>
              </summary>
              <div className="input-grid" style={{ marginTop: 12 }}>
                <label className="full">
                  Bearer Access Token (선택)
                  <textarea
                    rows={3}
                    placeholder="비어 있으면 x-actor-* 헤더 모드가 사용됩니다."
                    value={accessToken}
                    onChange={(event) => setAccessToken(event.target.value)}
                  />
                </label>
              </div>
              <p className="small">
                호출 {stats.total}건 (OK {stats.success} / FAIL {stats.fail}) · 현재 {pendingLabel ?? "-"}
              </p>
              {isProductionRuntime ? (
                <p className="small muted">
                  세션:{" "}
                  {supabaseSession
                    ? `${supabaseSession.email ?? supabaseSession.userId} · role=${supabaseSession.role ?? "-"} · org=${supabaseSession.organizationId ?? "-"} · actor=${supabaseSession.actorId ?? "-"}`
                    : "없음"}{" "}
                  (Bearer {usesBearerToken ? "ON" : "OFF"})
                </p>
              ) : null}
              {supabaseSessionError ? (
                <p className="small" style={{ color: "var(--danger)" }}>
                  세션 오류: {supabaseSessionError}
                </p>
              ) : null}
              <div className="actions">
                <button className="btn btn-secondary" onClick={clearLogs} disabled={logs.length === 0}>
                  로그 초기화
                </button>
              </div>
            </details>
          ) : null}

          {aggregate ? (
            <p className="small">
              근태 요약: 정규 {minutesToHours(aggregate.totals.regular)} / 연장{" "}
              {minutesToHours(aggregate.totals.overtime)} / 야간 {minutesToHours(aggregate.totals.night)} /
              휴일 {minutesToHours(aggregate.totals.holiday)} (급여반영 {aggregate.counts.payable}건)
            </p>
          ) : (
            <p className="small muted">근태 집계가 없습니다.</p>
          )}
        </article>

        <article className="panel">
          <h2>명세서 목록</h2>
          {runs.length === 0 ? (
            <p className="small muted">확정된 급여가 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="급여 명세서 목록">
              {runs.map((run) => (
                <li
                  key={run.id}
                  style={{
                    borderColor: selectedRun?.id === run.id ? "var(--primary)" : "var(--line)",
                    background: selectedRun?.id === run.id ? "var(--primary-soft)" : "#fff"
                  }}
                >
                  <span>
                    <strong>{formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)}</strong>{" "}
                    <span className="muted">
                      총지급 {formatKrw(run.grossPayKrw)} · 공제 {formatKrw(run.totalDeductionsKrw)} · 실지급{" "}
                      {formatKrw(run.netPayKrw)} · 확정 {formatDateTime(run.confirmedAt)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    선택
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article id="payslip-search-sort" className="panel panel-payslip-search-sort">
          <h2>Payslip Search/Sort</h2>
          <p className="small">
            Search confirmed payslips by run id/period/state and reorder quickly for follow-up actions.
          </p>
          <div className="payslip-search-toolbar">
            <label>
              Search Scope
              <select
                value={payslipSearchScope}
                onChange={(event) => setPayslipSearchScope(event.target.value as PayslipSearchScope)}
              >
                <option value="all">all</option>
                <option value="run_id">run id</option>
                <option value="period">period</option>
                <option value="state">state</option>
              </select>
            </label>
            <label className="full">
              Query
              <input
                value={payslipSearchQuery}
                onChange={(event) => setPayslipSearchQuery(event.target.value)}
                placeholder="e.g. RUN-2026-01, confirmed, 2026.01"
              />
            </label>
            <label>
              Sort
              <select
                value={payslipSortOption}
                onChange={(event) => setPayslipSortOption(event.target.value as PayslipSortOption)}
              >
                <option value="latest_desc">latest first</option>
                <option value="oldest_asc">oldest first</option>
                <option value="net_desc">net pay high</option>
                <option value="gross_desc">gross pay high</option>
              </select>
            </label>
            <div className="payslip-search-actions">
              <button type="button" className="btn btn-secondary btn-small" onClick={resetPayslipSearchControls}>
                reset
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={focusSelectedPayslipInSearch}
                disabled={!selectedRun}
              >
                focus selected
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={prioritizeNetPaySearchSort}>
                net pay high
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => jumpToSection("payslip-history-sort-hardening")}
              >
                sort hardening
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => jumpToSection("payslip-delay-risk-response")}
              >
                delay response
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => jumpToSection("payslip-mobile-follow-up-recommendation-upgrade")}
              >
                recommendation upgrade
              </button>
            </div>
          </div>
          {filteredPayslipSearchRows.length === 0 ? (
            <p className="small muted">No confirmed payslip matches current search options.</p>
          ) : (
            <ul className="payslip-search-list" aria-label="payslip search and sort list">
              {filteredPayslipSearchRows.slice(0, 24).map((row) => (
                <li key={row.key}>
                  <div className="payslip-search-head">
                    <strong>{row.runId}</strong>
                    <span className={`status-pill tone-${row.state === "CONFIRMED" ? "ok" : "idle"}`}>{row.state}</span>
                  </div>
                  <p>{row.periodLabel}</p>
                  <p className="small muted">
                    gross {formatKrw(row.grossPayKrw)} / deduction {formatKrw(row.totalDeductionsKrw)} / net{" "}
                    {formatKrw(row.netPayKrw)}
                  </p>
                  <div className="payslip-search-meta">
                    <span className="queue-history-chip">confirmed {formatDateTime(row.confirmedAt)}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRunId(row.runId)}
                  >
                    select
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article id="payslip-history-sort-accuracy" className="panel panel-payslip-history-sort-accuracy">
          <h2>Payslip History Sort Accuracy</h2>
          <p className="small">
            Compare top rows with baseline sort models to verify whether current history ordering matches intent.
          </p>
          <ul className="payslip-history-sort-accuracy-list" aria-label="payslip history sort accuracy feedback list">
            {payslipHistorySortAccuracyCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-history-sort-accuracy-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">score {card.accuracyScore}</span>
                </div>
                <p>{card.detail}</p>
                <div className="payslip-history-sort-accuracy-meta">
                  <span className="queue-history-chip">
                    match {card.matchedCount}/{card.totalCompared}
                  </span>
                  <span className="queue-history-chip">severity {card.severity}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  open search/sort
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="payslip-history-sort-hardening" className="panel panel-payslip-history-sort-hardening">
          <h2>Payslip History Sort Hardening</h2>
          <p className="small">
            Reinforces sort-accuracy signals with one-tap presets so payout follow-up order stays aligned.
          </p>
          <ul className="payslip-history-sort-hardening-list" aria-label="payslip history sort hardening feedback list">
            {payslipHistorySortHardeningCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-history-sort-hardening-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">gap {card.confidenceGap}</span>
                </div>
                <p>{card.detail}</p>
                <p className="small muted">{card.responseLabel}</p>
                <div className="payslip-history-sort-hardening-meta">
                  <span className="queue-history-chip">score {card.accuracyScore}</span>
                  <span className="queue-history-chip">{payslipSortOptionLabel(card.recommendedSortOption)}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runPayslipHistorySortHardeningAction(card)}
                >
                  apply preset
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="status-feedback" className="panel panel-payslip-status-feedback">
          <h2>상태/오류 피드백</h2>
          <div className="payslip-status-grid">
            <article className="payslip-status-card">
              <p>최근 API 상태</p>
              <strong>{statusFeedbackMessage}</strong>
              <span className={`status-pill tone-${statusFeedbackTone}`}>
                {statusFeedbackTone === "ok" ? "정상" : statusFeedbackTone === "fail" ? "실패" : "대기"}
              </span>
            </article>
            <article className="payslip-status-card">
              <p>최근 실패 원인</p>
              <strong>{latestFailureMessage || "실패 이력 없음"}</strong>
              <div className="actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => void copyLatestFailureCause()}
                  disabled={!latestFailedLog}
                >
                  실패 원인 복사
                </button>
              </div>
            </article>
            <article className="payslip-status-card">
              <p>최근 확정 명세</p>
              <strong>{selectedRun ? formatDateTime(selectedRun.confirmedAt) : "-"}</strong>
              <span className="muted">명세서 ID {selectedRun?.id ?? "-"}</span>
            </article>
            <article className="payslip-status-card">
              <p>복구 가이드</p>
              <strong>{statusRecoveryGuide}</strong>
              <span className="muted">
                마지막 오류 시각 {latestFailedLog ? latestFailedLog.at : "-"} / 마지막 조회{" "}
                {latestLog ? latestLog.at : "-"}
              </span>
            </article>
          </div>
        </article>

        <article id="compare-view" className="panel panel-payslip-compare">
          <div className="payslip-compare-head">
            <h2>명세서 비교 조회</h2>
            <div className="actions">
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={() => void copyCompareSnapshot()}
                disabled={!selectedRun || !compareRun}
              >
                비교 스냅샷 복사
              </button>
            </div>
          </div>
          {!selectedRun || compareCandidates.length === 0 ? (
            <p className="small muted">비교 가능한 명세서가 없습니다. 기간을 넓혀 조회하세요.</p>
          ) : (
            <>
              <div className="payslip-compare-controls">
                <label>
                  비교 대상
                  <select value={compareRunId} onChange={(event) => setCompareRunId(event.target.value)}>
                    {compareCandidates.map((run) => (
                      <option key={run.id} value={run.id}>
                        {formatDateOnly(run.periodStart)} ~ {formatDateOnly(run.periodEnd)} ({run.id})
                      </option>
                    ))}
                  </select>
                </label>
                <p className="small muted">비교 기간: {compareWindowLabel}</p>
              </div>
              <div className="payslip-compare-delta-grid">
                {compareMetrics.map((metric) => (
                  <article key={metric.id} className="payslip-compare-delta-card">
                    <p>{metric.label} 차이</p>
                    <strong>{formatDiffKrw(metric.diffValue)}</strong>
                    <span>{formatPercent(metric.diffRate)}</span>
                  </article>
                ))}
              </div>
              <div className="compare-table-wrap">
                <table className="compare-table" aria-label="명세서 비교 표">
                  <thead>
                    <tr>
                      <th>항목</th>
                      <th>현재 선택</th>
                      <th>비교 대상</th>
                      <th>증감</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compareMetrics.map((metric) => (
                      <tr key={metric.id}>
                        <th scope="row">{metric.label}</th>
                        <td>{formatKrw(metric.selectedValue)}</td>
                        <td>{formatKrw(metric.compareValue)}</td>
                        <td>{formatDiffKrw(metric.diffValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </article>

        <article id="payslip-confirmation-prediction" className="panel panel-payslip-confirmation-prediction">
          <h2>Payout Confirmation Prediction</h2>
          <p className="small">
            Review confirmation cadence risk and delivery readiness, then jump to the related section.
          </p>
          <ul
            className="payslip-confirmation-prediction-list"
            aria-label="payslip confirmation prediction feedback list"
          >
            {payslipConfirmationPredictionCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-confirmation-prediction-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">ETA {card.etaLabel}</span>
                </div>
                <p>{card.detail}</p>
                <div className="payslip-confirmation-prediction-meta">
                  <span className="queue-history-chip">severity {card.severity}</span>
                  <span className="queue-history-chip">{card.metricLabel}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  open related section
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="payslip-delay-risk-prediction" className="panel panel-payslip-delay-risk-prediction">
          <h2>Payout Delay Risk Prediction</h2>
          <p className="small">
            Review payout delay risk from confirmed history freshness, active search scope, and delivery handoff state.
          </p>
          <ul className="payslip-delay-risk-prediction-list" aria-label="payslip delay risk prediction feedback list">
            {payslipDelayRiskPredictionCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-delay-risk-prediction-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">risk {card.riskScore}</span>
                </div>
                <p>{card.detail}</p>
                <div className="payslip-delay-risk-prediction-meta">
                  <span className="queue-history-chip">rows {card.rowCount}</span>
                  <span className="queue-history-chip">watch {card.watchCount}</span>
                  <span className="queue-history-chip">critical {card.criticalCount}</span>
                  <span className="queue-history-chip">ETA {card.etaLabel}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection(card.targetSectionId)}
                >
                  open related section
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="payslip-delay-risk-response" className="panel panel-payslip-delay-risk-response">
          <h2>Payout Delay Risk Response</h2>
          <p className="small">
            Converts delay-risk prediction into response windows and one-tap mitigation presets.
          </p>
          <ul className="payslip-delay-risk-response-list" aria-label="payslip delay risk response feedback list">
            {payslipDelayRiskResponseCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-delay-risk-response-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">risk {card.riskScore}</span>
                </div>
                <p>{card.detail}</p>
                <p className="small muted">{card.responseLabel}</p>
                <div className="payslip-delay-risk-response-meta">
                  <span className="queue-history-chip">rows {card.rowCount}</span>
                  <span className="queue-history-chip">window {card.responseWindow}</span>
                  <span className="queue-history-chip">critical {card.criticalCount}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runPayslipDelayRiskResponseAction(card)}
                >
                  run response
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article id="mobile-delivery" className="panel panel-payslip-mobile-delivery">
          <h2>모바일 전달 흐름</h2>
          <p className="small">조회 실패 원인 확인 후 채널 준비와 전달 시뮬레이션 순서로 진행하세요.</p>
          <div className="delivery-channel-grid" role="radiogroup" aria-label="모바일 전달 채널">
            <label className={mobileDeliveryChannel === "kakao" ? "active" : ""}>
              <input
                type="radio"
                name="mobile-delivery-channel"
                checked={mobileDeliveryChannel === "kakao"}
                onChange={() => setMobileDeliveryChannel("kakao")}
              />
              카카오 알림톡
            </label>
            <label className={mobileDeliveryChannel === "email" ? "active" : ""}>
              <input
                type="radio"
                name="mobile-delivery-channel"
                checked={mobileDeliveryChannel === "email"}
                onChange={() => setMobileDeliveryChannel("email")}
              />
              이메일 링크
            </label>
            <label className={mobileDeliveryChannel === "sms" ? "active" : ""}>
              <input
                type="radio"
                name="mobile-delivery-channel"
                checked={mobileDeliveryChannel === "sms"}
                onChange={() => setMobileDeliveryChannel("sms")}
              />
              SMS 링크
            </label>
          </div>
          <ol className="mobile-delivery-step-list">
            <li className={mobileDeliveryState !== "idle" ? "done" : ""}>1) 조회/오류 확인</li>
            <li className={mobileDeliveryState === "ready" || mobileDeliveryState === "sent" ? "done" : ""}>
              2) 전달 준비
            </li>
            <li className={mobileDeliveryState === "sent" ? "done" : ""}>3) 전달 시뮬레이션</li>
          </ol>
          <div className="actions">
            <button type="button" className="btn btn-secondary" onClick={prepareMobileDelivery}>
              전달 준비
            </button>
            <button type="button" className="btn btn-primary" onClick={sendMobileDeliverySimulation}>
              전달 시뮬레이션
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setMobileDeliveryState("idle");
                setMobileDeliveryFeedback("");
              }}
            >
              흐름 초기화
            </button>
          </div>
          <p className={`mobile-delivery-feedback tone-${mobileDeliveryState}`}>
            상태: {mobileDeliveryStateLabel}
            {mobileDeliveryFeedback ? ` | ${mobileDeliveryFeedback}` : ""}
          </p>
        </article>

        <article id="payslip-mobile-follow-up-guide" className="panel panel-payslip-mobile-follow-up-guide">
          <h2>Mobile Follow-up Action Guide</h2>
          <p className="small">
            Execute next actions from one panel after search/sort, confirmation prediction, and delivery checks.
          </p>
          <ul className="payslip-mobile-follow-up-guide-list" aria-label="payslip mobile follow-up action guide list">
            {payslipMobileFollowUpCards.map((card) => (
              <li key={card.key} className={`tone-${card.tone}`}>
                <div className="payslip-mobile-follow-up-guide-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">{card.tone}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runPayslipMobileFollowUpAction(card)}
                >
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article
          id="payslip-mobile-follow-up-recommendation"
          className="panel panel-payslip-mobile-follow-up-recommendation"
        >
          <h2>Mobile Follow-up Recommendation</h2>
          <p className="small">
            Prioritized recommendations combine sort accuracy, delay risk, and delivery handoff into one mobile panel.
          </p>
          <ul
            className="payslip-mobile-follow-up-recommendation-list"
            aria-label="payslip mobile follow-up recommendation list"
          >
            {payslipMobileFollowUpRecommendationCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-mobile-follow-up-recommendation-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">{card.severity}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runPayslipMobileFollowUpRecommendationAction(card)}
                >
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article
          id="payslip-mobile-follow-up-recommendation-upgrade"
          className="panel panel-payslip-mobile-follow-up-recommendation-upgrade"
        >
          <h2>Mobile Follow-up Recommendation Upgrade</h2>
          <p className="small">
            Prioritized recommendations combine sort hardening, delay response, and delivery handoff recovery.
          </p>
          <ul
            className="payslip-mobile-follow-up-recommendation-upgrade-list"
            aria-label="payslip mobile follow-up recommendation upgrade list"
          >
            {payslipMobileFollowUpRecommendationUpgradeCards.map((card) => (
              <li key={card.key} className={`severity-${card.severity}`}>
                <div className="payslip-mobile-follow-up-recommendation-upgrade-head">
                  <strong>{card.label}</strong>
                  <span className="queue-history-chip">priority {card.priorityScore}</span>
                </div>
                <p>{card.detail}</p>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => runPayslipMobileFollowUpRecommendationUpgradeAction(card)}
                >
                  {card.ctaLabel}
                </button>
              </li>
            ))}
          </ul>
        </article>

        <article className="panel panel-payslip-print">
          <h2>선택 명세서 상세</h2>
          {!selectedRun ? (
            <p className="small muted">선택된 명세서가 없습니다.</p>
          ) : (
            <>
              <div className="payslip-print-actions actions no-print">
                <button type="button" className="btn btn-primary" onClick={() => window.print()}>
                  인쇄/PDF 저장
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void copyPayslipFileName()}>
                  PDF 파일명 복사
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => void copySelectedRunId()}>
                  명세서 ID 복사
                </button>
              </div>
              {payslipFileName ? (
                <p className="small muted no-print" style={{ marginTop: 8 }}>
                  권장 파일명: <code>{payslipFileName}</code>
                </p>
              ) : null}

              <article className="payslip-sheet" aria-label="급여 명세서 문서 서식">
                <header className="payslip-sheet-header">
                  <div>
                    <p className="eyebrow">FlowHR Payslip</p>
                    <h3>{formatMonthLabel(selectedRun.periodStart)} 급여 명세서</h3>
                    <p className="small muted">
                      지급 기간 {formatDateOnly(selectedRun.periodStart)} ~{" "}
                      {formatDateOnly(selectedRun.periodEnd)}
                    </p>
                  </div>
                  <ul className="payslip-meta-list">
                    <li>
                      <span>직원 ID</span>
                      <strong>{selectedRun.employeeId ?? employeeId}</strong>
                    </li>
                    <li>
                      <span>명세서 ID</span>
                      <strong>{selectedRun.id}</strong>
                    </li>
                    <li>
                      <span>확정일</span>
                      <strong>{formatDateOnly(selectedRun.confirmedAt)}</strong>
                    </li>
                    <li>
                      <span>정산 상태</span>
                      <strong>{selectedRun.state}</strong>
                    </li>
                  </ul>
                </header>

                <section>
                  <h4>요약</h4>
                  <div className="payslip-grid">
                    <article className="summary-card">
                      <p>총지급</p>
                      <strong>{formatKrw(selectedRun.grossPayKrw)}</strong>
                    </article>
                    <article className="summary-card">
                      <p>총공제</p>
                      <strong>{formatKrw(selectedRun.totalDeductionsKrw)}</strong>
                    </article>
                    <article className="summary-card">
                      <p>실지급</p>
                      <strong>{formatKrw(selectedRun.netPayKrw)}</strong>
                    </article>
                  </div>
                </section>

                <section>
                  <h4>지급/공제 상세</h4>
                  <ul className="simple-list">
                    <li>
                      <span>원천세</span>
                      <strong>{formatKrw(selectedRun.withholdingTaxKrw)}</strong>
                    </li>
                    <li>
                      <span>사회보험</span>
                      <strong>{formatKrw(selectedRun.socialInsuranceKrw)}</strong>
                    </li>
                    <li>
                      <span>기타 공제</span>
                      <strong>{formatKrw(selectedRun.otherDeductionsKrw)}</strong>
                    </li>
                  </ul>
                </section>

                <section className="payslip-explain">
                  {deductionExplainSections.map((section) => (
                    <div key={section.id} className="payslip-explain-section">
                      <h4>{section.title}</h4>
                      {section.items.length === 0 ? (
                        <p className="small muted">표시할 항목이 없습니다.</p>
                      ) : (
                        <ul className="payslip-explain-list">
                          {section.items.map((item) => (
                            <li key={item.key}>
                              <div>
                                <strong>{item.label}</strong>
                                <p>{item.description}</p>
                              </div>
                              <strong className="payslip-explain-amount">{formatKrw(item.amountKrw)}</strong>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </section>

                {aggregate ? (
                  <section>
                    <h4>근태 기준(참고)</h4>
                    <p className="small">
                      정규 {minutesToHours(aggregate.totals.regular)} / 연장{" "}
                      {minutesToHours(aggregate.totals.overtime)} / 야간{" "}
                      {minutesToHours(aggregate.totals.night)} / 휴일{" "}
                      {minutesToHours(aggregate.totals.holiday)} (급여반영 {aggregate.counts.payable}건)
                    </p>
                  </section>
                ) : null}

                {selectedRun.deductionBreakdown ? (
                  <details className="details no-print" style={{ marginTop: 12 }}>
                    <summary>공제 Breakdown 원본</summary>
                    <pre className="small" style={{ marginTop: 10, whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(selectedRun.deductionBreakdown, null, 2)}
                    </pre>
                  </details>
                ) : null}
              </article>
            </>
          )}
        </article>

      </section>
    </main>
  );
}

