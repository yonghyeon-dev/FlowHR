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
    runtimeLabel: string;
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
    sessionRoleLabel: string;
    sessionOrganizationLabel: string;
    sessionActorLabel: string;
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
    printVerificationTitle: string;
    printVerificationExpectedNet: string;
    printVerificationActualNet: string;
    printVerificationResult: string;
    printVerificationPass: string;
    printVerificationFail: string;
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
