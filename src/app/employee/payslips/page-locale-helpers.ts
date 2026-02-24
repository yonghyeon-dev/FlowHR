export type PayslipSearchSortCopy = {
  title: string;
  description: string;
  scopeLabel: string;
  queryLabel: string;
  queryPlaceholder: string;
  sortLabel: string;
  scope: {
    all: string;
    runId: string;
    period: string;
    state: string;
  };
  sort: {
    latest: string;
    oldest: string;
    netDesc: string;
    grossDesc: string;
  };
  actions: {
    reset: string;
    focusSelected: string;
    netPayHigh: string;
  };
  empty: string;
  listAriaLabel: string;
  gross: string;
  deduction: string;
  net: string;
  confirmed: string;
  select: string;
};

export function resolveRuntimeLocale() {
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

export function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString(resolveRuntimeLocale());
}

export function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  const runtimeLocale = resolveRuntimeLocale();
  const unitLabel = runtimeLocale.toLowerCase().startsWith("ko") ? "원" : " KRW";
  return `${value.toLocaleString(runtimeLocale)}${unitLabel}`;
}

export function extractErrorMessage(body: unknown) {
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

export function formatDiffKrw(value: number | null) {
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

export function formatDateOnly(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString(resolveRuntimeLocale());
}

export function formatMonthLabel(value: string | null) {
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

export function resolvePayslipSearchSortCopy(isKoLocale: boolean): PayslipSearchSortCopy {
  if (isKoLocale) {
    return {
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
    };
  }

  return {
    title: "Payslip Search/Sort",
    description: "Search confirmed payslips by run id/period/state and reorder quickly for follow-up actions.",
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
  };
}
