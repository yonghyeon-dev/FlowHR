import type { DeductionDescriptionMap, PayslipRunState } from "@/app/employee/payslips/page-locale-types";

export function resolvePayslipRunStateLabel(state: PayslipRunState | string, isKoLocale: boolean) {
  if (state === "CONFIRMED") {
    return isKoLocale ? "확정" : "Confirmed";
  }
  if (state === "PREVIEWED") {
    return isKoLocale ? "미확정" : "Previewed";
  }
  return isKoLocale ? "알 수 없음" : state;
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
