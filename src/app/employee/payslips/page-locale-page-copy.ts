import type { PayslipPageCopy } from "@/app/employee/payslips/page-locale-types";

export function resolvePayslipPageCopy(isKoLocale: boolean): PayslipPageCopy {
  if (isKoLocale) {
    return {
      pageTitle: "급여 명세서",
      pageSubtitle: "직원은 본인 확정 급여 내역만 조회할 수 있습니다.",
      nav: {
        employeePortal: "직원 포털",
        login: "로그인",
        admin: "관리자",
        home: "홈"
      },
      productionNotice: {
        prefix: "현재 런타임은",
        runtimeLabel: "운영",
        suffix: "입니다. 명세서를 조회하려면 로그인 세션(토큰)이 필요합니다:"
      },
      kpi: {
        count: "명세서 건수",
        totalGross: "총지급 합계",
        totalDeductions: "총공제 합계",
        totalNet: "실수령 합계",
        apiCalls: "요청 호출",
        ok: "성공",
        fail: "실패"
      },
      filters: {
        title: "조회 조건",
        organizationIdOptional: "조직 식별자(선택)",
        organizationIdPlaceholder: "예: 조직-00001",
        employeeId: "내 직원 번호",
        periodStart: "기간 시작",
        periodEnd: "기간 종료",
        actions: {
          refresh: "조회",
          currentMonth: "이번 달",
          previousMonth: "지난 달",
          lastThreeMonths: "최근 3개월",
          downloadCsv: "내보내기"
        }
      },
      devTools: {
        summary: "개발/검증 설정",
        hiddenByDefault: "기본은 숨김",
        bearerTokenOptional: "액세스 토큰(선택)",
        bearerPlaceholder: "비워두면 세션 기반 요청 헤더 모드를 사용합니다.",
        bearerStatusLabel: "토큰 모드",
        sessionRoleLabel: "권한",
        sessionOrganizationLabel: "조직 식별자",
        sessionActorLabel: "액터 식별자",
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
        payable: "급여 반영",
        payableUnit: "건",
        empty: "근태 집계가 없습니다."
      },
      payslipList: {
        title: "명세서 목록",
        empty: "확정 급여가 없습니다.",
        ariaLabel: "급여 명세서 목록",
        gross: "총지급",
        deduction: "공제",
        net: "실수령",
        confirmed: "확정",
        select: "선택"
      },
      status: {
        title: "상태/오류 피드백",
        latestApi: "최근 요청 상태",
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
        guideIfNoFailure: "실패 이력이 없으면 최신 명세서를 선택해 후속 작업을 진행하세요.",
        guideIfFailure: "실패 원인을 확인하고 조회 기간/직원/조직 식별자를 점검한 뒤 다시 조회하세요."
      },
      compare: {
        title: "명세서 비교 조회",
        copySnapshot: "비교 스냅샷 복사",
        empty: "비교 가능한 명세서가 없습니다. 기간을 넓혀 다시 조회하세요.",
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
          net: "실수령"
        }
      },
      detail: {
        title: "선택 명세서 상세",
        empty: "선택한 명세서가 없습니다.",
        actions: {
          printSavePdf: "인쇄/문서 저장",
          copyPdfFileName: "문서 파일명 복사",
          copyPayslipId: "명세서 번호 복사"
        },
        recommendedFileName: "권장 파일명",
        sheetAriaLabel: "급여 명세서 문서 형식",
        sheetEyebrow: "FlowHR 급여 명세서",
        sheetTitleSuffix: "급여 명세서",
        payPeriod: "지급 기간",
        employeeId: "직원 번호",
        payslipId: "명세서 번호",
        confirmedDate: "확정일",
        settlementState: "정산 상태",
        summaryTitle: "요약",
        paymentDeductionTitle: "지급 공제 상세",
        withholdingTax: "원천세",
        socialInsurance: "사회보험",
        otherDeductions: "기타 공제",
        deductionGuideTitle: "공제 항목 설명",
        deductionComponentTitle: "법정공제 세부 구성",
        taxCreditReferenceTitle: "세액공제 참고 항목",
        noItems: "표시할 항목이 없습니다.",
        attendanceReference: "근태 기준(참고)",
        deductionBreakdownRaw: "공제 원본(구조 데이터)"
      },
      logs: {
        fetchPayslips: "급여 명세서 조회",
        fetchAttendance: "근태 집계 조회",
        copyPayslipId: "명세서 번호 복사",
        copyPdfFileName: "문서 파일명 복사",
        copyFailureCause: "실패 원인 복사",
        copyCompareSnapshot: "비교 스냅샷 복사"
      },
      deductionFallback: {
        statutoryDetail: "법정공제 세부 항목입니다.",
        taxCreditDetail: "세액공제 계산에 사용되는 참고 항목입니다."
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
      runtimeLabel: "production",
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
      sessionRoleLabel: "Role",
      sessionOrganizationLabel: "Organization",
      sessionActorLabel: "Actor",
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
