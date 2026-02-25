import type { PayslipSearchSortCopy } from "@/app/employee/payslips/page-locale-types";

export function resolvePayslipSearchSortCopy(isKoLocale: boolean): PayslipSearchSortCopy {
  if (isKoLocale) {
    return {
      title: "명세서 검색/정렬",
      description: "실행 번호/기간/상태 조건으로 확정 명세서를 빠르게 찾고 정렬합니다.",
      scopeLabel: "검색 범위",
      queryLabel: "검색어",
      queryPlaceholder: "예: 실행-2026-01, 확정, 2026.01",
      sortLabel: "정렬",
      scope: {
        all: "전체",
        runId: "실행 번호",
        period: "기간",
        state: "상태"
      },
      sort: {
        latest: "최신순",
        oldest: "오래된순",
        netDesc: "실수령 높은순",
        grossDesc: "총지급 높은순"
      },
      actions: {
        reset: "초기화",
        focusSelected: "선택 명세서로 스크롤",
        netPayHigh: "실수령 높은순"
      },
      empty: "현재 검색 조건과 일치하는 확정 명세서가 없습니다.",
      listAriaLabel: "명세서 검색/정렬 목록",
      gross: "총지급",
      deduction: "공제",
      net: "실수령",
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
