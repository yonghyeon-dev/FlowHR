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

export type PayslipPageCopy = {
  pageTitle: string;
  pageSubtitle: string;
  nav: {
    employeePortal: string;
    login: string;
    admin: string;
    home: string;
  };
  productionNotice: {
    prefix: string;
    suffix: string;
  };
  kpi: {
    count: string;
    totalGross: string;
    totalDeductions: string;
    totalNet: string;
    apiCalls: string;
    ok: string;
    fail: string;
  };
  filters: {
    title: string;
    organizationIdOptional: string;
    organizationIdPlaceholder: string;
    employeeId: string;
    periodStart: string;
    periodEnd: string;
    actions: {
      refresh: string;
      currentMonth: string;
      previousMonth: string;
      lastThreeMonths: string;
      downloadCsv: string;
    };
  };
  devTools: {
    summary: string;
    hiddenByDefault: string;
    bearerTokenOptional: string;
    bearerPlaceholder: string;
    bearerStatusLabel: string;
    callCount: string;
    current: string;
    session: string;
    none: string;
    bearerOn: string;
    bearerOff: string;
    sessionError: string;
    clearLogs: string;
  };
  attendance: {
    summaryPrefix: string;
    regular: string;
    overtime: string;
    night: string;
    holiday: string;
    payable: string;
    payableUnit: string;
    empty: string;
  };
  payslipList: {
    title: string;
    empty: string;
    ariaLabel: string;
    gross: string;
    deduction: string;
    net: string;
    confirmed: string;
    select: string;
  };
  status: {
    title: string;
    latestApi: string;
    tone: {
      ok: string;
      fail: string;
      idle: string;
    };
    latestFailureCause: string;
    noFailureHistory: string;
    copyFailureCause: string;
    latestConfirmed: string;
    payslipId: string;
    recoveryGuide: string;
    lastErrorAt: string;
    lastCheckedAt: string;
    noRecentResult: string;
    successSuffix: string;
    failureSuffix: string;
    guideIfNoFailure: string;
    guideIfFailure: string;
  };
  compare: {
    title: string;
    copySnapshot: string;
    empty: string;
    target: string;
    window: string;
    diffSuffix: string;
    tableAriaLabel: string;
    headers: {
      metric: string;
      selected: string;
      compare: string;
      diff: string;
    };
    metrics: {
      gross: string;
      deduction: string;
      net: string;
    };
  };
  detail: {
    title: string;
    empty: string;
    actions: {
      printSavePdf: string;
      copyPdfFileName: string;
      copyPayslipId: string;
    };
    recommendedFileName: string;
    sheetAriaLabel: string;
    sheetEyebrow: string;
    sheetTitleSuffix: string;
    payPeriod: string;
    employeeId: string;
    payslipId: string;
    confirmedDate: string;
    settlementState: string;
    summaryTitle: string;
    paymentDeductionTitle: string;
    withholdingTax: string;
    socialInsurance: string;
    otherDeductions: string;
    deductionGuideTitle: string;
    deductionComponentTitle: string;
    taxCreditReferenceTitle: string;
    noItems: string;
    attendanceReference: string;
    deductionBreakdownRaw: string;
  };
  logs: {
    fetchPayslips: string;
    fetchAttendance: string;
    copyPayslipId: string;
    copyPdfFileName: string;
    copyFailureCause: string;
    copyCompareSnapshot: string;
  };
  deductionFallback: {
    statutoryDetail: string;
    taxCreditDetail: string;
  };
};

export type PayslipRunState = "PREVIEWED" | "CONFIRMED";

export type DeductionDescriptionMap = Record<string, { label: string; description: string }>;

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
      description: "실행 번호/기간/상태 조건으로 확정 명세서를 빠르게 찾고 정렬합니다.",
      scopeLabel: "검색 범위",
      queryLabel: "검색어",
      queryPlaceholder: "예: RUN-2026-01, 확정, 2026.01",
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

export function resolvePayslipPageCopy(isKoLocale: boolean): PayslipPageCopy {
  if (isKoLocale) {
    return {
      pageTitle: "급여 명세서",
      pageSubtitle: "직원은 본인의 확정된 급여 내역만 조회할 수 있습니다.",
      nav: {
        employeePortal: "직원 포털",
        login: "로그인",
        admin: "관리자",
        home: "홈"
      },
      productionNotice: {
        prefix: "현재 환경은",
        suffix: "입니다. 명세서 조회를 위해 로그인 세션(인증 토큰)이 필요합니다:"
      },
      kpi: {
        count: "명세서 건수",
        totalGross: "총지급 합계",
        totalDeductions: "총공제 합계",
        totalNet: "실지급 합계",
        apiCalls: "API 호출",
        ok: "성공",
        fail: "실패"
      },
      filters: {
        title: "조회 조건",
        organizationIdOptional: "조직 식별자 (선택)",
        organizationIdPlaceholder: "예: ORG-00001",
        employeeId: "내 직원 번호",
        periodStart: "기간 시작",
        periodEnd: "기간 종료",
        actions: {
          refresh: "조회",
          currentMonth: "이번 달",
          previousMonth: "지난 달",
          lastThreeMonths: "최근 3개월",
          downloadCsv: "CSV 다운로드"
        }
      },
      devTools: {
        summary: "개발/검증 설정",
        hiddenByDefault: "기본은 숨김",
        bearerTokenOptional: "접근 토큰 (선택)",
        bearerPlaceholder: "비어 있으면 x-actor-* 헤더 모드가 사용됩니다.",
        bearerStatusLabel: "토큰 모드",
        callCount: "호출",
        current: "현재",
        session: "세션",
        none: "없음",
        bearerOn: "사용",
        bearerOff: "미사용",
        sessionError: "세션 오류",
        clearLogs: "로그 초기화"
      },
      attendance: {
        summaryPrefix: "근태 요약",
        regular: "정규",
        overtime: "연장",
        night: "야간",
        holiday: "휴일",
        payable: "급여반영",
        payableUnit: "건",
        empty: "근태 집계가 없습니다."
      },
      payslipList: {
        title: "명세서 목록",
        empty: "확정된 급여가 없습니다.",
        ariaLabel: "급여 명세서 목록",
        gross: "총지급",
        deduction: "공제",
        net: "실지급",
        confirmed: "확정",
        select: "선택"
      },
      status: {
        title: "상태/오류 피드백",
        latestApi: "최근 API 상태",
        tone: {
          ok: "정상",
          fail: "실패",
          idle: "대기"
        },
        latestFailureCause: "최근 실패 원인",
        noFailureHistory: "실패 이력 없음",
        copyFailureCause: "실패 원인 복사",
        latestConfirmed: "최근 확정 명세",
        payslipId: "명세서 번호",
        recoveryGuide: "복구 가이드",
        lastErrorAt: "마지막 오류 시각",
        lastCheckedAt: "마지막 조회",
        noRecentResult: "최근 조회 결과가 없습니다.",
        successSuffix: "요청이 정상 처리되었습니다.",
        failureSuffix: "요청이 실패했습니다.",
        guideIfNoFailure: "실패 이력이 없으면 최신 명세서를 선택한 뒤 전달 준비를 진행하세요.",
        guideIfFailure: "실패 원인을 확인한 뒤 조회 기간/사번/조직 식별자를 점검하고 다시 조회하세요."
      },
      compare: {
        title: "명세서 비교 조회",
        copySnapshot: "비교 스냅샷 복사",
        empty: "비교 가능한 명세서가 없습니다. 기간을 넓혀 조회하세요.",
        target: "비교 대상",
        window: "비교 기간",
        diffSuffix: "차이",
        tableAriaLabel: "명세서 비교 표",
        headers: {
          metric: "항목",
          selected: "현재 선택",
          compare: "비교 대상",
          diff: "증감"
        },
        metrics: {
          gross: "총지급",
          deduction: "총공제",
          net: "실지급"
        }
      },
      detail: {
        title: "선택 명세서 상세",
        empty: "선택된 명세서가 없습니다.",
        actions: {
          printSavePdf: "인쇄/PDF 저장",
          copyPdfFileName: "PDF 파일명 복사",
          copyPayslipId: "명세서 번호 복사"
        },
        recommendedFileName: "권장 파일명",
        sheetAriaLabel: "급여 명세서 문서 서식",
        sheetEyebrow: "FlowHR 급여 명세서",
        sheetTitleSuffix: "급여 명세서",
        payPeriod: "지급 기간",
        employeeId: "직원 번호",
        payslipId: "명세서 번호",
        confirmedDate: "확정일",
        settlementState: "정산 상태",
        summaryTitle: "요약",
        paymentDeductionTitle: "지급/공제 상세",
        withholdingTax: "원천세",
        socialInsurance: "사회보험",
        otherDeductions: "기타 공제",
        deductionGuideTitle: "공제 항목 설명",
        deductionComponentTitle: "법정공제 세부 구성",
        taxCreditReferenceTitle: "세액공제 참고 항목",
        noItems: "표시할 항목이 없습니다.",
        attendanceReference: "근태 기준(참고)",
        deductionBreakdownRaw: "공제 원본(JSON)"
      },
      logs: {
        fetchPayslips: "급여 명세서 조회",
        fetchAttendance: "근태 집계 조회",
        copyPayslipId: "명세서 번호 복사",
        copyPdfFileName: "PDF 파일명 복사",
        copyFailureCause: "실패 원인 복사",
        copyCompareSnapshot: "비교 스냅샷 복사"
      },
      deductionFallback: {
        statutoryDetail: "법정공제 세부 항목입니다.",
        taxCreditDetail: "세액공제 계산에 사용된 항목입니다."
      }
    };
  }

  return {
    pageTitle: "Payslips",
    pageSubtitle: "Employees can only access their own confirmed payroll details.",
    nav: {
      employeePortal: "Employee portal",
      login: "Login",
      admin: "Admin",
      home: "Home"
    },
    productionNotice: {
      prefix: "Current runtime is",
      suffix: ". A login session (Bearer) is required to view payslips:"
    },
    kpi: {
      count: "Payslip count",
      totalGross: "Total gross",
      totalDeductions: "Total deductions",
      totalNet: "Total net",
      apiCalls: "API calls",
      ok: "OK",
      fail: "FAIL"
    },
    filters: {
      title: "Filters",
      organizationIdOptional: "Organization ID (optional)",
      organizationIdPlaceholder: "e.g. ORG-00001",
      employeeId: "My employee ID",
      periodStart: "Period start",
      periodEnd: "Period end",
      actions: {
        refresh: "Refresh",
        currentMonth: "This month",
        previousMonth: "Previous month",
        lastThreeMonths: "Last 3 months",
        downloadCsv: "Download CSV"
      }
    },
    devTools: {
      summary: "Dev/validation settings",
      hiddenByDefault: "hidden by default",
      bearerTokenOptional: "Bearer Access Token (optional)",
      bearerPlaceholder: "When empty, x-actor-* header mode is used.",
      bearerStatusLabel: "Bearer mode",
      callCount: "Calls",
      current: "Current",
      session: "Session",
      none: "none",
      bearerOn: "ON",
      bearerOff: "OFF",
      sessionError: "Session error",
      clearLogs: "Clear logs"
    },
      attendance: {
        summaryPrefix: "Attendance summary",
        regular: "Regular",
        overtime: "Overtime",
        night: "Night",
        holiday: "Holiday",
        payable: "Payroll applied",
        payableUnit: " records",
        empty: "No attendance aggregate found."
      },
    payslipList: {
      title: "Payslip list",
      empty: "No confirmed payroll run found.",
      ariaLabel: "payslip list",
      gross: "Gross",
      deduction: "Deduction",
      net: "Net",
      confirmed: "Confirmed",
      select: "Select"
    },
    status: {
      title: "Status and error feedback",
      latestApi: "Latest API status",
      tone: {
        ok: "Healthy",
        fail: "Failed",
        idle: "Idle"
      },
      latestFailureCause: "Latest failure cause",
      noFailureHistory: "No failure history",
      copyFailureCause: "Copy failure cause",
      latestConfirmed: "Latest confirmed payslip",
      payslipId: "Payslip ID",
      recoveryGuide: "Recovery guide",
      lastErrorAt: "Last error at",
      lastCheckedAt: "Last checked at",
      noRecentResult: "No recent query result.",
      successSuffix: "request completed successfully.",
      failureSuffix: "request failed.",
      guideIfNoFailure: "When there is no failure, select the latest payslip and continue delivery prep.",
      guideIfFailure: "Review the failure cause, verify period/employee/organization, then query again."
    },
    compare: {
      title: "Payslip comparison",
      copySnapshot: "Copy comparison snapshot",
      empty: "No comparable payslip found. Expand the period and retry.",
      target: "Compare target",
      window: "Compare window",
      diffSuffix: "difference",
      tableAriaLabel: "payslip comparison table",
      headers: {
        metric: "Metric",
        selected: "Selected",
        compare: "Compare",
        diff: "Diff"
      },
      metrics: {
        gross: "Gross",
        deduction: "Deduction",
        net: "Net"
      }
    },
    detail: {
      title: "Selected payslip detail",
      empty: "No payslip selected.",
      actions: {
        printSavePdf: "Print/Save PDF",
        copyPdfFileName: "Copy PDF filename",
        copyPayslipId: "Copy payslip ID"
      },
      recommendedFileName: "Suggested filename",
      sheetAriaLabel: "payslip print sheet",
      sheetEyebrow: "FlowHR Payslip",
      sheetTitleSuffix: "Payslip",
      payPeriod: "Pay period",
      employeeId: "Employee ID",
      payslipId: "Payslip ID",
      confirmedDate: "Confirmed at",
      settlementState: "Settlement state",
      summaryTitle: "Summary",
        paymentDeductionTitle: "Payment and deduction detail",
        withholdingTax: "Withholding tax",
        socialInsurance: "Social insurance",
        otherDeductions: "Other deductions",
        deductionGuideTitle: "Deduction item guide",
        deductionComponentTitle: "Statutory deduction components",
        taxCreditReferenceTitle: "Tax credit reference items",
        noItems: "No items to display.",
        attendanceReference: "Attendance reference",
        deductionBreakdownRaw: "Raw deduction breakdown"
    },
    logs: {
      fetchPayslips: "Fetch payslips",
      fetchAttendance: "Fetch attendance aggregate",
      copyPayslipId: "Copy payslip ID",
      copyPdfFileName: "Copy PDF filename",
      copyFailureCause: "Copy failure cause",
      copyCompareSnapshot: "Copy comparison snapshot"
    },
    deductionFallback: {
      statutoryDetail: "Statutory deduction detail item.",
      taxCreditDetail: "Tax credit calculation reference item."
    }
  };
}

export function resolvePayslipRunStateLabel(state: PayslipRunState, isKoLocale: boolean) {
  if (state === "CONFIRMED") {
    return isKoLocale ? "확정" : "Confirmed";
  }
  if (state === "PREVIEWED") {
    return isKoLocale ? "미확정" : "Previewed";
  }
  return state;
}

export function resolveDeductionDescriptionMap(isKoLocale: boolean): DeductionDescriptionMap {
  if (isKoLocale) {
    return {
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
  }

  return {
    withholdingTaxKrw: {
      label: "Withholding tax",
      description: "Combined withholding amount for income and local income taxes."
    },
    socialInsuranceKrw: {
      label: "Social insurance",
      description: "Employee share for pension, health, long-term care, and employment insurance."
    },
    otherDeductionsKrw: {
      label: "Other deductions",
      description: "Additional policy-based deductions such as advances or manual settlements."
    },
    incomeTaxKrw: {
      label: "Income tax",
      description: "Monthly income tax calculated from the taxable base."
    },
    localIncomeTaxKrw: {
      label: "Local income tax",
      description: "Local tax item coupled with income tax."
    },
    nationalPensionKrw: {
      label: "National pension",
      description: "Employee contribution for national pension."
    },
    healthInsuranceKrw: {
      label: "Health insurance",
      description: "Employee contribution for health insurance."
    },
    longTermCareKrw: {
      label: "Long-term care",
      description: "Long-term care insurance contribution linked to health insurance."
    },
    employmentInsuranceKrw: {
      label: "Employment insurance",
      description: "Employee contribution for employment insurance."
    },
    preCreditIncomeTaxKrw: {
      label: "Income tax before credits",
      description: "Calculated income tax before applying additional tax credits."
    },
    dependentTaxCreditKrw: {
      label: "Dependent tax credit",
      description: "Tax credit applied based on dependent qualification."
    },
    additionalTaxCreditKrw: {
      label: "Additional tax credit",
      description: "Additional tax credit applied by policy or eligibility rules."
    },
    totalTaxCreditKrw: {
      label: "Total tax credit",
      description: "Sum of all applied tax credits."
    }
  };
}
