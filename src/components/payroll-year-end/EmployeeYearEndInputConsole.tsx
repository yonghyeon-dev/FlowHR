"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { FinalizedYearEndSettlementResponse } from "@/components/withholding-receipt/types";
import { currentYear, formatKrw } from "@/components/withholding-receipt/types";
import { type FlowLocale } from "@/lib/i18n/locales";
import { useI18n } from "@/lib/i18n/provider";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

const deductionCaps = {
  personalPensionKrw: 7_000_000,
  insurancePremiumKrw: 1_000_000,
  medicalExpenseKrw: 15_000_000,
  educationExpenseKrw: 9_000_000,
  donationKrw: 10_000_000,
  housingSavingsKrw: 4_000_000
} as const;

const taxCreditCaps = {
  earnedIncomeTaxCreditKrw: 740_000,
  childTaxCreditKrw: 900_000,
  additionalTaxCreditKrw: 1_000_000
} as const;

function parseNonNegativeInt(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.trunc(parsed) : 0;
}

function parseRate(value: string, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    return fallback;
  }
  return parsed;
}

function isNonNegativeIntegerText(value: string) {
  return /^\d+$/.test(value.trim());
}

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

type EmployeeYearEndInputCopy = {
  heroEyebrow: string;
  title: string;
  description: string;
  inputTitle: string;
  yearLabel: string;
  employeeIdLabel: string;
  nonTaxableAnnualIncomeLabel: string;
  earnedIncomeTaxCreditLabel: string;
  childTaxCreditLabel: string;
  additionalTaxCreditLabel: string;
  personalPensionLabel: string;
  insurancePremiumLabel: string;
  medicalExpenseLabel: string;
  educationExpenseLabel: string;
  donationLabel: string;
  housingSavingsLabel: string;
  annualIncomeTaxRateLabel: string;
  localIncomeTaxRateLabel: string;
  accessTokenLabel: string;
  organizationIdFallbackLabel: string;
  loadFinalizedSettlementAction: string;
  pendingFinalizedSettlement: string;
  loadFinalizedSettlementLogLabel: string;
  validationTitle: string;
  validationChecklistAriaLabel: string;
  validationYearLabel: string;
  validationEmployeeIdLabel: string;
  validationTaxRatesLabel: string;
  validationAmountsLabel: string;
  validationNonTaxableLabel: string;
  validationPassLabel: string;
  validationFailLabel: string;
  coreLoadInvalidGuide: string;
  requestFailedStatus: string;
  requestFailedCheckLogsStatus: string;
  loadedStatusPrefix: string;
  simulationTitle: string;
  loadFirstGuide: string;
  summaryFinalization: string;
  summaryGrossPay: string;
  summaryAppliedDeduction: string;
  summaryTaxableAnnualIncome: string;
  summaryAppliedTaxCredit: string;
  summaryEstimatedLiability: string;
  summaryBaselineLiability: string;
  summaryLiabilityChange: string;
  summaryWithholdingDelta: string;
  summaryAdditionalDueRefund: string;
  capsGuide: string;
  accuracyGuideTitle: string;
  accuracyGuideNoSimulation: string;
  accuracyGuideNoWarnings: string;
  accuracyGuideCapAppliedPrefix: string;
  accuracyGuideNonTaxableAdjusted: string;
  accuracyGuideLiabilityIncreasePrefix: string;
  accuracyGuideLiabilityDecreasePrefix: string;
  accuracyGuideLiabilityNoChange: string;
  accuracyGuideAdditionalDuePrefix: string;
  accuracyGuideRefundPrefix: string;
  apiLogsTitle: string;
  apiLogsTotalPrefix: string;
  apiLogsRunningPrefix: string;
  apiLogsEmpty: string;
  okLabel: string;
  failLabel: string;
  openWithholdingReceiptAction: string;
  backToEmployeeAction: string;
  sessionErrorPrefix: string;
};

const employeeYearEndInputCopyByLocale: Record<FlowLocale, EmployeeYearEndInputCopy> = {
  ko: {
    heroEyebrow: "FlowHR 직원",
    title: "연말정산 입력 시뮬레이터",
    description: "확정된 정산 결과를 불러와 공제/세액공제 입력 영향도를 제출 전에 시뮬레이션합니다.",
    inputTitle: "입력",
    yearLabel: "연도",
    employeeIdLabel: "직원 ID",
    nonTaxableAnnualIncomeLabel: "비과세 연간 소득",
    earnedIncomeTaxCreditLabel: "근로소득 세액공제",
    childTaxCreditLabel: "자녀 세액공제",
    additionalTaxCreditLabel: "추가 세액공제",
    personalPensionLabel: "개인연금",
    insurancePremiumLabel: "보험료",
    medicalExpenseLabel: "의료비",
    educationExpenseLabel: "교육비",
    donationLabel: "기부금",
    housingSavingsLabel: "주택저축",
    annualIncomeTaxRateLabel: "연간 소득세율",
    localIncomeTaxRateLabel: "지방소득세율",
    accessTokenLabel: "액세스 토큰(선택)",
    organizationIdFallbackLabel: "조직 ID(dev fallback)",
    loadFinalizedSettlementAction: "확정 정산 불러오기",
    pendingFinalizedSettlement: "확정 정산 조회",
    loadFinalizedSettlementLogLabel: "확정 정산 조회",
    validationTitle: "실시간 입력 검증",
    validationChecklistAriaLabel: "연말정산 입력 검증 체크리스트",
    validationYearLabel: "연도(2000~2100)",
    validationEmployeeIdLabel: "직원 ID 입력",
    validationTaxRatesLabel: "세율(0~1 범위)",
    validationAmountsLabel: "금액 입력(0 이상 정수)",
    validationNonTaxableLabel: "비과세 연소득 <= 연 총지급(정산 로드 후)",
    validationPassLabel: "통과",
    validationFailLabel: "실패",
    coreLoadInvalidGuide: "연도와 직원 ID를 먼저 확인해 주세요.",
    requestFailedStatus: "요청이 실패했습니다",
    requestFailedCheckLogsStatus: "요청이 실패했습니다. 로그를 확인하세요.",
    loadedStatusPrefix: "조회 완료",
    simulationTitle: "시뮬레이션 결과",
    loadFirstGuide: "먼저 확정 정산을 불러오세요.",
    summaryFinalization: "확정 ID",
    summaryGrossPay: "총급여",
    summaryAppliedDeduction: "적용 공제",
    summaryTaxableAnnualIncome: "과세 연간 소득",
    summaryAppliedTaxCredit: "적용 세액공제",
    summaryEstimatedLiability: "예상 세부담",
    summaryBaselineLiability: "기준 세부담",
    summaryLiabilityChange: "세부담 증감",
    summaryWithholdingDelta: "원천징수 차액",
    summaryAdditionalDueRefund: "추가 납부 / 환급",
    capsGuide:
      "한도: 소득공제(개인연금 7,000,000 / 보험료 1,000,000 / 의료비 15,000,000 / 교육비 9,000,000 / 기부금 10,000,000 / 주택저축 4,000,000), 세액공제(근로 740,000 / 자녀 900,000 / 추가 1,000,000).",
    accuracyGuideTitle: "정확도 가이드",
    accuracyGuideNoSimulation: "시뮬레이션 결과를 불러오면 자동 가이드가 표시됩니다.",
    accuracyGuideNoWarnings: "현재 입력 기준으로 보정/주의 항목이 없습니다.",
    accuracyGuideCapAppliedPrefix: "한도 적용",
    accuracyGuideNonTaxableAdjusted: "비과세 연소득이 총급여를 초과해 총급여 기준으로 보정됩니다.",
    accuracyGuideLiabilityIncreasePrefix: "예상 세부담 증가",
    accuracyGuideLiabilityDecreasePrefix: "예상 세부담 감소",
    accuracyGuideLiabilityNoChange: "예상 세부담 변동이 없습니다.",
    accuracyGuideAdditionalDuePrefix: "추가 납부 예상",
    accuracyGuideRefundPrefix: "환급 예상",
    apiLogsTitle: "API 로그",
    apiLogsTotalPrefix: "총",
    apiLogsRunningPrefix: "실행 중",
    apiLogsEmpty: "아직 API 호출이 없습니다.",
    okLabel: "성공",
    failLabel: "실패",
    openWithholdingReceiptAction: "원천징수영수증 열기",
    backToEmployeeAction: "직원 화면으로",
    sessionErrorPrefix: "세션 오류"
  },
  en: {
    heroEyebrow: "FlowHR Employee",
    title: "Year-End Input Simulator",
    description:
      "Load your finalized settlement and simulate deduction/tax-credit input effects before HR submission.",
    inputTitle: "Input",
    yearLabel: "Year",
    employeeIdLabel: "Employee ID",
    nonTaxableAnnualIncomeLabel: "Non-taxable Annual Income",
    earnedIncomeTaxCreditLabel: "Earned Income Tax Credit",
    childTaxCreditLabel: "Child Tax Credit",
    additionalTaxCreditLabel: "Additional Tax Credit",
    personalPensionLabel: "Personal Pension",
    insurancePremiumLabel: "Insurance Premium",
    medicalExpenseLabel: "Medical Expense",
    educationExpenseLabel: "Education Expense",
    donationLabel: "Donation",
    housingSavingsLabel: "Housing Savings",
    annualIncomeTaxRateLabel: "Annual Income Tax Rate",
    localIncomeTaxRateLabel: "Local Income Tax Rate",
    accessTokenLabel: "Access Token (optional)",
    organizationIdFallbackLabel: "Organization ID (dev fallback)",
    loadFinalizedSettlementAction: "Load Finalized Settlement",
    pendingFinalizedSettlement: "finalized settlement load",
    loadFinalizedSettlementLogLabel: "load finalized settlement",
    validationTitle: "Real-time Input Validation",
    validationChecklistAriaLabel: "Year-end input validation checklist",
    validationYearLabel: "Year (2000~2100)",
    validationEmployeeIdLabel: "Employee ID provided",
    validationTaxRatesLabel: "Tax rates in 0~1 range",
    validationAmountsLabel: "Amount fields are non-negative integers",
    validationNonTaxableLabel: "Non-taxable annual income <= annual gross pay",
    validationPassLabel: "PASS",
    validationFailLabel: "FAIL",
    coreLoadInvalidGuide: "Check year and employee ID before loading finalized settlement.",
    requestFailedStatus: "request failed",
    requestFailedCheckLogsStatus: "request failed; check logs",
    loadedStatusPrefix: "loaded",
    simulationTitle: "Simulation Result",
    loadFirstGuide: "Load finalized settlement first.",
    summaryFinalization: "Finalization",
    summaryGrossPay: "Gross Pay",
    summaryAppliedDeduction: "Applied Deduction",
    summaryTaxableAnnualIncome: "Taxable Annual Income",
    summaryAppliedTaxCredit: "Applied Tax Credit",
    summaryEstimatedLiability: "Estimated Liability",
    summaryBaselineLiability: "Baseline Liability",
    summaryLiabilityChange: "Liability Change",
    summaryWithholdingDelta: "Withholding Delta",
    summaryAdditionalDueRefund: "Additional Due / Refund",
    capsGuide:
      "Caps: deduction(personal pension 7,000,000 / insurance 1,000,000 / medical 15,000,000 / education 9,000,000 / donation 10,000,000 / housing 4,000,000), tax credit(earned 740,000 / child 900,000 / additional 1,000,000).",
    accuracyGuideTitle: "Accuracy Guide",
    accuracyGuideNoSimulation: "Load simulation result to see auto guidance.",
    accuracyGuideNoWarnings: "No correction/warning items for current input.",
    accuracyGuideCapAppliedPrefix: "Cap applied",
    accuracyGuideNonTaxableAdjusted: "Non-taxable annual income exceeded annual gross pay and was adjusted.",
    accuracyGuideLiabilityIncreasePrefix: "Estimated liability increases",
    accuracyGuideLiabilityDecreasePrefix: "Estimated liability decreases",
    accuracyGuideLiabilityNoChange: "Estimated liability unchanged.",
    accuracyGuideAdditionalDuePrefix: "Additional withholding due",
    accuracyGuideRefundPrefix: "Expected refund",
    apiLogsTitle: "API Logs",
    apiLogsTotalPrefix: "total",
    apiLogsRunningPrefix: "running",
    apiLogsEmpty: "No API call yet.",
    okLabel: "OK",
    failLabel: "FAIL",
    openWithholdingReceiptAction: "Open Withholding Receipt",
    backToEmployeeAction: "Back to Employee",
    sessionErrorPrefix: "Session error"
  }
};

export default function EmployeeYearEndInputConsole() {
  const { locale } = useI18n();
  const copy = employeeYearEndInputCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";

  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [employeeId, setEmployeeId] = useStickyStringState("flowhr:ctx:employeeId", "EMP-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(currentYear()));
  const [nonTaxableAnnualIncomeKrw, setNonTaxableAnnualIncomeKrw] = useState("0");
  const [earnedIncomeTaxCreditKrw, setEarnedIncomeTaxCreditKrw] = useState("0");
  const [childTaxCreditKrw, setChildTaxCreditKrw] = useState("0");
  const [additionalTaxCreditKrw, setAdditionalTaxCreditKrw] = useState("0");
  const [personalPensionKrw, setPersonalPensionKrw] = useState("0");
  const [insurancePremiumKrw, setInsurancePremiumKrw] = useState("0");
  const [medicalExpenseKrw, setMedicalExpenseKrw] = useState("0");
  const [educationExpenseKrw, setEducationExpenseKrw] = useState("0");
  const [donationKrw, setDonationKrw] = useState("0");
  const [housingSavingsKrw, setHousingSavingsKrw] = useState("0");
  const [annualIncomeTaxRate, setAnnualIncomeTaxRate] = useState("0.03");
  const [localIncomeTaxRate, setLocalIncomeTaxRate] = useState("0.1");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [finalizedSettlement, setFinalizedSettlement] =
    useState<FinalizedYearEndSettlementResponse | null>(null);

  const yearValid = useMemo(() => {
    const normalized = year.trim();
    if (!/^\d{4}$/.test(normalized)) {
      return false;
    }
    const parsed = Number(normalized);
    return Number.isInteger(parsed) && parsed >= 2000 && parsed <= 2100;
  }, [year]);

  const employeeIdValid = useMemo(() => employeeId.trim().length > 0, [employeeId]);

  const annualIncomeTaxRateValid = useMemo(() => {
    const parsed = Number(annualIncomeTaxRate);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1;
  }, [annualIncomeTaxRate]);

  const localIncomeTaxRateValid = useMemo(() => {
    const parsed = Number(localIncomeTaxRate);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1;
  }, [localIncomeTaxRate]);

  const integerInputsValid = useMemo(() => {
    return [
      nonTaxableAnnualIncomeKrw,
      earnedIncomeTaxCreditKrw,
      childTaxCreditKrw,
      additionalTaxCreditKrw,
      personalPensionKrw,
      insurancePremiumKrw,
      medicalExpenseKrw,
      educationExpenseKrw,
      donationKrw,
      housingSavingsKrw
    ].every(isNonNegativeIntegerText);
  }, [
    additionalTaxCreditKrw,
    childTaxCreditKrw,
    donationKrw,
    earnedIncomeTaxCreditKrw,
    educationExpenseKrw,
    housingSavingsKrw,
    insurancePremiumKrw,
    medicalExpenseKrw,
    nonTaxableAnnualIncomeKrw,
    personalPensionKrw
  ]);

  const nonTaxableWithinGrossValid = useMemo(() => {
    if (!finalizedSettlement) {
      return true;
    }
    return (
      parseNonNegativeInt(nonTaxableAnnualIncomeKrw) <=
      finalizedSettlement.settlement.annualTotalsKrw.grossPayKrw
    );
  }, [finalizedSettlement, nonTaxableAnnualIncomeKrw]);

  const validationChecks = useMemo(() => {
    return [
      {
        id: "year",
        label: copy.validationYearLabel,
        pass: yearValid
      },
      {
        id: "employee",
        label: copy.validationEmployeeIdLabel,
        pass: employeeIdValid
      },
      {
        id: "rates",
        label: copy.validationTaxRatesLabel,
        pass: annualIncomeTaxRateValid && localIncomeTaxRateValid
      },
      {
        id: "integers",
        label: copy.validationAmountsLabel,
        pass: integerInputsValid
      },
      {
        id: "non-taxable",
        label: copy.validationNonTaxableLabel,
        pass: nonTaxableWithinGrossValid
      }
    ];
  }, [
    annualIncomeTaxRateValid,
    copy.validationAmountsLabel,
    copy.validationEmployeeIdLabel,
    copy.validationNonTaxableLabel,
    copy.validationTaxRatesLabel,
    copy.validationYearLabel,
    employeeIdValid,
    integerInputsValid,
    localIncomeTaxRateValid,
    nonTaxableWithinGrossValid,
    yearValid
  ]);

  const validationPassCount = useMemo(
    () => validationChecks.filter((check) => check.pass).length,
    [validationChecks]
  );

  const coreLoadValid = yearValid && employeeIdValid;

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  function buildHeaders() {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "employee";
      headers["x-actor-id"] = employeeId.trim() || "EMP-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function loadFinalizedSettlement() {
    setPendingLabel(copy.pendingFinalizedSettlement);
    try {
      const query = new URLSearchParams({
        year: String(parseNonNegativeInt(year)),
        employeeId: employeeId.trim()
      });
      const response = await fetch(`/api/payroll/year-end/finalized-settlement?${query.toString()}`, {
        method: "GET",
        headers: buildHeaders()
      });
      const body = (await response.json()) as FinalizedYearEndSettlementResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.loadFinalizedSettlementLogLabel,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(copy.requestFailedCheckLogsStatus);
        return;
      }
      setFinalizedSettlement(body);
      setStatusMessage(`${copy.loadedStatusPrefix} ${body.settlement.finalizationId}`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.requestFailedStatus);
    } finally {
      setPendingLabel(null);
    }
  }

  const simulation = useMemo(() => {
    if (!finalizedSettlement) {
      return null;
    }
    const annualGrossPayKrw = finalizedSettlement.settlement.annualTotalsKrw.grossPayKrw;
    const priorWithheldTaxKrw = finalizedSettlement.settlement.settlementKrw.priorWithheldTaxKrw;
    const baselineTaxLiabilityKrw = finalizedSettlement.settlement.settlementKrw.annualTaxLiabilityKrw;
    const normalizedNonTaxableAnnualIncomeKrw = Math.min(
      parseNonNegativeInt(nonTaxableAnnualIncomeKrw),
      annualGrossPayKrw
    );
    const normalizedTaxCreditInputs = {
      earnedIncomeTaxCreditKrw: parseNonNegativeInt(earnedIncomeTaxCreditKrw),
      childTaxCreditKrw: parseNonNegativeInt(childTaxCreditKrw),
      additionalTaxCreditKrw: parseNonNegativeInt(additionalTaxCreditKrw)
    };
    const normalizedDeductions = {
      personalPensionKrw: parseNonNegativeInt(personalPensionKrw),
      insurancePremiumKrw: parseNonNegativeInt(insurancePremiumKrw),
      medicalExpenseKrw: parseNonNegativeInt(medicalExpenseKrw),
      educationExpenseKrw: parseNonNegativeInt(educationExpenseKrw),
      donationKrw: parseNonNegativeInt(donationKrw),
      housingSavingsKrw: parseNonNegativeInt(housingSavingsKrw)
    };
    const appliedDeductions = {
      personalPensionKrw: Math.min(normalizedDeductions.personalPensionKrw, deductionCaps.personalPensionKrw),
      insurancePremiumKrw: Math.min(normalizedDeductions.insurancePremiumKrw, deductionCaps.insurancePremiumKrw),
      medicalExpenseKrw: Math.min(normalizedDeductions.medicalExpenseKrw, deductionCaps.medicalExpenseKrw),
      educationExpenseKrw: Math.min(normalizedDeductions.educationExpenseKrw, deductionCaps.educationExpenseKrw),
      donationKrw: Math.min(normalizedDeductions.donationKrw, deductionCaps.donationKrw),
      housingSavingsKrw: Math.min(normalizedDeductions.housingSavingsKrw, deductionCaps.housingSavingsKrw)
    };
    const totalAppliedDeductionKrw = Object.values(appliedDeductions).reduce((sum, value) => sum + value, 0);
    const taxableBeforeDeductionKrw = Math.max(
      annualGrossPayKrw - normalizedNonTaxableAnnualIncomeKrw,
      0
    );
    const taxableAnnualIncomeKrw = Math.max(taxableBeforeDeductionKrw - totalAppliedDeductionKrw, 0);

    const appliedTaxCredits = {
      earnedIncomeTaxCreditKrw: Math.min(
        normalizedTaxCreditInputs.earnedIncomeTaxCreditKrw,
        taxCreditCaps.earnedIncomeTaxCreditKrw
      ),
      childTaxCreditKrw: Math.min(
        normalizedTaxCreditInputs.childTaxCreditKrw,
        taxCreditCaps.childTaxCreditKrw
      ),
      additionalTaxCreditKrw: Math.min(
        normalizedTaxCreditInputs.additionalTaxCreditKrw,
        taxCreditCaps.additionalTaxCreditKrw
      )
    };
    const totalAppliedTaxCreditKrw = Object.values(appliedTaxCredits).reduce((sum, value) => sum + value, 0);

    const annualRate = parseRate(annualIncomeTaxRate, 0.03);
    const localRate = parseRate(localIncomeTaxRate, 0.1);
    const annualIncomeTaxBeforeCreditKrw = Math.round(taxableAnnualIncomeKrw * annualRate);
    const annualIncomeTaxAfterCreditKrw = Math.max(
      annualIncomeTaxBeforeCreditKrw - totalAppliedTaxCreditKrw,
      0
    );
    const annualLocalIncomeTaxKrw = Math.round(annualIncomeTaxAfterCreditKrw * localRate);
    const annualTaxLiabilityKrw = annualIncomeTaxAfterCreditKrw + annualLocalIncomeTaxKrw;
    const withholdingDeltaKrw = annualTaxLiabilityKrw - priorWithheldTaxKrw;

    return {
      annualGrossPayKrw,
      priorWithheldTaxKrw,
      baselineTaxLiabilityKrw,
      normalizedNonTaxableAnnualIncomeKrw,
      totalAppliedDeductionKrw,
      taxableAnnualIncomeKrw,
      totalAppliedTaxCreditKrw,
      annualTaxLiabilityKrw,
      withholdingDeltaKrw,
      additionalWithholdingDueKrw: Math.max(withholdingDeltaKrw, 0),
      withholdingRefundKrw: Math.max(-withholdingDeltaKrw, 0),
      liabilityChangeKrw: annualTaxLiabilityKrw - baselineTaxLiabilityKrw
    };
  }, [
    additionalTaxCreditKrw,
    annualIncomeTaxRate,
    childTaxCreditKrw,
    donationKrw,
    earnedIncomeTaxCreditKrw,
    educationExpenseKrw,
    finalizedSettlement,
    housingSavingsKrw,
    insurancePremiumKrw,
    localIncomeTaxRate,
    medicalExpenseKrw,
    nonTaxableAnnualIncomeKrw,
    personalPensionKrw
  ]);

  const accuracyGuidanceItems = useMemo(() => {
    const items: string[] = [];
    const deductionInputs = [
      { label: copy.personalPensionLabel, input: parseNonNegativeInt(personalPensionKrw), cap: deductionCaps.personalPensionKrw },
      { label: copy.insurancePremiumLabel, input: parseNonNegativeInt(insurancePremiumKrw), cap: deductionCaps.insurancePremiumKrw },
      { label: copy.medicalExpenseLabel, input: parseNonNegativeInt(medicalExpenseKrw), cap: deductionCaps.medicalExpenseKrw },
      { label: copy.educationExpenseLabel, input: parseNonNegativeInt(educationExpenseKrw), cap: deductionCaps.educationExpenseKrw },
      { label: copy.donationLabel, input: parseNonNegativeInt(donationKrw), cap: deductionCaps.donationKrw },
      { label: copy.housingSavingsLabel, input: parseNonNegativeInt(housingSavingsKrw), cap: deductionCaps.housingSavingsKrw }
    ];
    for (const entry of deductionInputs) {
      if (entry.input > entry.cap) {
        items.push(
          `${copy.accuracyGuideCapAppliedPrefix}: ${entry.label} ${formatKrw(entry.input, runtimeLocale)} -> ${formatKrw(entry.cap, runtimeLocale)}`
        );
      }
    }

    const taxCreditInputs = [
      { label: copy.earnedIncomeTaxCreditLabel, input: parseNonNegativeInt(earnedIncomeTaxCreditKrw), cap: taxCreditCaps.earnedIncomeTaxCreditKrw },
      { label: copy.childTaxCreditLabel, input: parseNonNegativeInt(childTaxCreditKrw), cap: taxCreditCaps.childTaxCreditKrw },
      { label: copy.additionalTaxCreditLabel, input: parseNonNegativeInt(additionalTaxCreditKrw), cap: taxCreditCaps.additionalTaxCreditKrw }
    ];
    for (const entry of taxCreditInputs) {
      if (entry.input > entry.cap) {
        items.push(
          `${copy.accuracyGuideCapAppliedPrefix}: ${entry.label} ${formatKrw(entry.input, runtimeLocale)} -> ${formatKrw(entry.cap, runtimeLocale)}`
        );
      }
    }

    if (!nonTaxableWithinGrossValid && finalizedSettlement) {
      items.push(
        `${copy.accuracyGuideNonTaxableAdjusted} (${formatKrw(finalizedSettlement.settlement.annualTotalsKrw.grossPayKrw, runtimeLocale)})`
      );
    }

    if (!simulation) {
      return items;
    }

    if (simulation.liabilityChangeKrw > 0) {
      items.push(
        `${copy.accuracyGuideLiabilityIncreasePrefix}: ${formatKrw(simulation.liabilityChangeKrw, runtimeLocale)}`
      );
    } else if (simulation.liabilityChangeKrw < 0) {
      items.push(
        `${copy.accuracyGuideLiabilityDecreasePrefix}: ${formatKrw(Math.abs(simulation.liabilityChangeKrw), runtimeLocale)}`
      );
    } else {
      items.push(copy.accuracyGuideLiabilityNoChange);
    }

    if (simulation.additionalWithholdingDueKrw > 0) {
      items.push(
        `${copy.accuracyGuideAdditionalDuePrefix}: ${formatKrw(simulation.additionalWithholdingDueKrw, runtimeLocale)}`
      );
    }
    if (simulation.withholdingRefundKrw > 0) {
      items.push(
        `${copy.accuracyGuideRefundPrefix}: ${formatKrw(simulation.withholdingRefundKrw, runtimeLocale)}`
      );
    }

    return items;
  }, [
    additionalTaxCreditKrw,
    childTaxCreditKrw,
    copy.accuracyGuideAdditionalDuePrefix,
    copy.accuracyGuideCapAppliedPrefix,
    copy.accuracyGuideLiabilityDecreasePrefix,
    copy.accuracyGuideLiabilityIncreasePrefix,
    copy.accuracyGuideLiabilityNoChange,
    copy.accuracyGuideNonTaxableAdjusted,
    copy.accuracyGuideRefundPrefix,
    copy.additionalTaxCreditLabel,
    copy.childTaxCreditLabel,
    copy.donationLabel,
    copy.earnedIncomeTaxCreditLabel,
    copy.educationExpenseLabel,
    copy.housingSavingsLabel,
    copy.insurancePremiumLabel,
    copy.medicalExpenseLabel,
    copy.personalPensionLabel,
    donationKrw,
    earnedIncomeTaxCreditKrw,
    educationExpenseKrw,
    finalizedSettlement,
    housingSavingsKrw,
    insurancePremiumKrw,
    medicalExpenseKrw,
    nonTaxableWithinGrossValid,
    personalPensionKrw,
    runtimeLocale,
    simulation
  ]);

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.inputTitle}</h2>
          <div className="input-grid">
            <label>{copy.yearLabel}<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>{copy.employeeIdLabel}<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>{copy.nonTaxableAnnualIncomeLabel}<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
            <label>{copy.earnedIncomeTaxCreditLabel}<input value={earnedIncomeTaxCreditKrw} onChange={(event) => setEarnedIncomeTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.childTaxCreditLabel}<input value={childTaxCreditKrw} onChange={(event) => setChildTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.additionalTaxCreditLabel}<input value={additionalTaxCreditKrw} onChange={(event) => setAdditionalTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.personalPensionLabel}<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>{copy.insurancePremiumLabel}<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>{copy.medicalExpenseLabel}<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>{copy.educationExpenseLabel}<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>{copy.donationLabel}<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>{copy.housingSavingsLabel}<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label>{copy.annualIncomeTaxRateLabel}<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>{copy.localIncomeTaxRateLabel}<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
          </div>
          <label>{copy.accessTokenLabel}<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>{copy.organizationIdFallbackLabel}<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button
              className="btn btn-primary"
              onClick={() => void loadFinalizedSettlement()}
              disabled={pendingLabel !== null || !coreLoadValid}
            >
              {copy.loadFinalizedSettlementAction}
            </button>
          </div>
          <div className="pre-submit-check-wrap" style={{ marginTop: 10 }}>
            <p className="small" style={{ margin: 0 }}>
              {copy.validationTitle} ({validationPassCount}/
              {validationChecks.length})
            </p>
            <ul
              className="pre-submit-check-list"
              aria-label={copy.validationChecklistAriaLabel}
            >
              {validationChecks.map((check) => (
                <li key={check.id} className={check.pass ? "pass" : "fail"}>
                  <strong>{check.pass ? copy.validationPassLabel : copy.validationFailLabel}</strong>
                  <span>{check.label}</span>
                </li>
              ))}
            </ul>
          </div>
          {!coreLoadValid ? (
            <p className="small fail">
              {copy.coreLoadInvalidGuide}
            </p>
          ) : null}
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>{copy.simulationTitle}</h2>
          {!simulation ? <p className="small">{copy.loadFirstGuide}</p> : (
            <ul className="simple-list">
              <li><span>{copy.summaryFinalization}</span><strong>{finalizedSettlement?.settlement.finalizationId}</strong></li>
              <li><span>{copy.summaryGrossPay}</span><strong>{formatKrw(simulation.annualGrossPayKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryAppliedDeduction}</span><strong>{formatKrw(simulation.totalAppliedDeductionKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryTaxableAnnualIncome}</span><strong>{formatKrw(simulation.taxableAnnualIncomeKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryAppliedTaxCredit}</span><strong>{formatKrw(simulation.totalAppliedTaxCreditKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryEstimatedLiability}</span><strong>{formatKrw(simulation.annualTaxLiabilityKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryBaselineLiability}</span><strong>{formatKrw(simulation.baselineTaxLiabilityKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryLiabilityChange}</span><strong>{formatKrw(simulation.liabilityChangeKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryWithholdingDelta}</span><strong>{formatKrw(simulation.withholdingDeltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.summaryAdditionalDueRefund}</span><strong>{formatKrw(simulation.additionalWithholdingDueKrw, runtimeLocale)} / {formatKrw(simulation.withholdingRefundKrw, runtimeLocale)}</strong></li>
            </ul>
          )}
          <p className="small">{copy.capsGuide}</p>
          <div className="pre-submit-check-wrap" style={{ marginTop: 10 }}>
            <p className="small" style={{ margin: 0 }}>{copy.accuracyGuideTitle}</p>
            {!simulation ? (
              <p className="small muted">{copy.accuracyGuideNoSimulation}</p>
            ) : accuracyGuidanceItems.length === 0 ? (
              <p className="small ok">{copy.accuracyGuideNoWarnings}</p>
            ) : (
              <ul className="pre-submit-check-list">
                {accuracyGuidanceItems.map((item, index) => (
                  <li key={`${index}-${item}`} className="pass">
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
        <article className="panel">
          <h2>{copy.apiLogsTitle}</h2>
          <p className="small">
            {copy.apiLogsTotalPrefix} {logs.length}
            {pendingLabel ? ` / ${copy.apiLogsRunningPrefix} ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? <p className="small">{copy.apiLogsEmpty}</p> : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? copy.okLabel : copy.failLabel}</span> {log.label} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/employee/withholding-receipt" className="btn btn-secondary">{copy.openWithholdingReceiptAction}</Link>
            <Link href="/employee" className="btn btn-secondary">{copy.backToEmployeeAction}</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
