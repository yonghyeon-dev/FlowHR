"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

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

function resolveRuntimeLocale() {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang?.trim().toLowerCase();
    if (htmlLang.startsWith("ko")) {
      return "ko-KR";
    }
    if (htmlLang.startsWith("en")) {
      return "en-US";
    }
  }
  if (typeof navigator !== "undefined" && navigator.language.trim().length > 0) {
    return navigator.language;
  }
  return "ko-KR";
}

function isRuntimeKoLocale() {
  return resolveRuntimeLocale().toLowerCase().startsWith("ko");
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(resolveRuntimeLocale());
}

function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  const runtimeLocale = resolveRuntimeLocale();
  const unitLabel = runtimeLocale.toLowerCase().startsWith("ko") ? "원" : " KRW";
  return `${value.toLocaleString(runtimeLocale)}${unitLabel}`;
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

function extractErrorMessage(body: unknown) {
  const koLocale = isRuntimeKoLocale();
  if (!body) {
    return koLocale ? "원인을 확인할 수 없습니다." : "Unable to identify the cause.";
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
  const runtimeLocale = resolveRuntimeLocale();
  const unitLabel = runtimeLocale.toLowerCase().startsWith("ko") ? "원" : " KRW";
  const abs = Math.abs(value).toLocaleString(runtimeLocale);
  if (value > 0) {
    return `+${abs}${unitLabel}`;
  }
  if (value < 0) {
    return `-${abs}${unitLabel}`;
  }
  return `0${unitLabel}`;
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
  return parsed.toLocaleDateString(resolveRuntimeLocale());
}

function formatMonthLabel(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  const runtimeLocale = resolveRuntimeLocale();
  if (runtimeLocale.toLowerCase().startsWith("ko")) {
    return `${parsed.getFullYear()}년 ${String(parsed.getMonth() + 1).padStart(2, "0")}월`;
  }
  return new Intl.DateTimeFormat(runtimeLocale, { year: "numeric", month: "long" }).format(parsed);
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

  const showDevTools = isDevToolsEnabled();
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";

  const searchSortCopy = useMemo(
    () =>
      isKoLocale
        ? {
            title: "명세서 검색/정렬",
            description: "run id/기간/상태 조건으로 확정 명세서를 빠르게 찾고 정렬합니다.",
            scopeLabel: "검색 범위",
            queryLabel: "검색어",
            queryPlaceholder: "예: RUN-2026-01, confirmed, 2026.01",
            sortLabel: "정렬",
            scope: {
              all: "전체",
              runId: "run id",
              period: "기간",
              state: "상태"
            },
            sort: {
              latest: "최신순",
              oldest: "오래된순",
              netDesc: "실지급 높은순",
              grossDesc: "총지급 높은순"
            },
            actions: {
              reset: "초기화",
              focusSelected: "선택 명세서로 포커스",
              netPayHigh: "실지급 높은순"
            },
            empty: "현재 검색 조건과 일치하는 확정 명세서가 없습니다.",
            listAriaLabel: "명세서 검색 정렬 목록",
            gross: "총지급",
            deduction: "공제",
            net: "실지급",
            confirmed: "확정",
            select: "선택"
          }
        : {
            title: "Payslip Search/Sort",
            description:
              "Search confirmed payslips by run id/period/state and reorder quickly for follow-up actions.",
            scopeLabel: "Search scope",
            queryLabel: "Query",
            queryPlaceholder: "e.g. RUN-2026-01, confirmed, 2026.01",
            sortLabel: "Sort",
            scope: {
              all: "all",
              runId: "run id",
              period: "period",
              state: "state"
            },
            sort: {
              latest: "latest first",
              oldest: "oldest first",
              netDesc: "net pay high",
              grossDesc: "gross pay high"
            },
            actions: {
              reset: "reset",
              focusSelected: "focus selected",
              netPayHigh: "net pay high"
            },
            empty: "No confirmed payslip matches current search options.",
            listAriaLabel: "payslip search and sort list",
            gross: "gross",
            deduction: "deduction",
            net: "net",
            confirmed: "confirmed",
            select: "select"
          },
    [isKoLocale]
  );

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
          at: new Date().toLocaleString(runtimeLocale),
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
          at: new Date().toLocaleString(runtimeLocale),
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
          at: new Date().toLocaleString(runtimeLocale),
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
          at: new Date().toLocaleString(runtimeLocale),
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
          at: new Date().toLocaleString(runtimeLocale),
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
        at: new Date().toLocaleString(runtimeLocale),
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
          <h2>{searchSortCopy.title}</h2>
          <p className="small">{searchSortCopy.description}</p>
          <div className="payslip-search-toolbar">
            <label>
              {searchSortCopy.scopeLabel}
              <select
                value={payslipSearchScope}
                onChange={(event) => setPayslipSearchScope(event.target.value as PayslipSearchScope)}
              >
                <option value="all">{searchSortCopy.scope.all}</option>
                <option value="run_id">{searchSortCopy.scope.runId}</option>
                <option value="period">{searchSortCopy.scope.period}</option>
                <option value="state">{searchSortCopy.scope.state}</option>
              </select>
            </label>
            <label className="full">
              {searchSortCopy.queryLabel}
              <input
                value={payslipSearchQuery}
                onChange={(event) => setPayslipSearchQuery(event.target.value)}
                placeholder={searchSortCopy.queryPlaceholder}
              />
            </label>
            <label>
              {searchSortCopy.sortLabel}
              <select
                value={payslipSortOption}
                onChange={(event) => setPayslipSortOption(event.target.value as PayslipSortOption)}
              >
                <option value="latest_desc">{searchSortCopy.sort.latest}</option>
                <option value="oldest_asc">{searchSortCopy.sort.oldest}</option>
                <option value="net_desc">{searchSortCopy.sort.netDesc}</option>
                <option value="gross_desc">{searchSortCopy.sort.grossDesc}</option>
              </select>
            </label>
            <div className="payslip-search-actions">
              <button type="button" className="btn btn-secondary btn-small" onClick={resetPayslipSearchControls}>
                {searchSortCopy.actions.reset}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-small"
                onClick={focusSelectedPayslipInSearch}
                disabled={!selectedRun}
              >
                {searchSortCopy.actions.focusSelected}
              </button>
              <button type="button" className="btn btn-secondary btn-small" onClick={prioritizeNetPaySearchSort}>
                {searchSortCopy.actions.netPayHigh}
              </button>
            </div>
          </div>
          {filteredPayslipSearchRows.length === 0 ? (
            <p className="small muted">{searchSortCopy.empty}</p>
          ) : (
            <ul className="payslip-search-list" aria-label={searchSortCopy.listAriaLabel}>
              {filteredPayslipSearchRows.slice(0, 24).map((row) => (
                <li key={row.key}>
                  <div className="payslip-search-head">
                    <strong>{row.runId}</strong>
                    <span className={`status-pill tone-${row.state === "CONFIRMED" ? "ok" : "idle"}`}>{row.state}</span>
                  </div>
                  <p>{row.periodLabel}</p>
                  <p className="small muted">
                    {searchSortCopy.gross} {formatKrw(row.grossPayKrw)} / {searchSortCopy.deduction}{" "}
                    {formatKrw(row.totalDeductionsKrw)} / {searchSortCopy.net}{" "}
                    {formatKrw(row.netPayKrw)}
                  </p>
                  <div className="payslip-search-meta">
                    <span className="queue-history-chip">
                      {searchSortCopy.confirmed} {formatDateTime(row.confirmedAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setSelectedRunId(row.runId)}
                  >
                    {searchSortCopy.select}
                  </button>
                </li>
              ))}
            </ul>
          )}
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

