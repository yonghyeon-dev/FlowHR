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
            <button className="btn btn-primary" onClick={() => void loadFinalizedSettlement()} disabled={pendingLabel !== null}>
              {copy.loadFinalizedSettlementAction}
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">{copy.sessionErrorPrefix}: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>{copy.simulationTitle}</h2>
          {!simulation ? <p className="small">{copy.loadFirstGuide}</p> : (
            <ul className="simple-list">
              <li><span>{copy.summaryFinalization}</span><strong>{finalizedSettlement?.settlement.finalizationId}</strong></li>
              <li><span>{copy.summaryGrossPay}</span><strong>{formatKrw(simulation.annualGrossPayKrw)}</strong></li>
              <li><span>{copy.summaryAppliedDeduction}</span><strong>{formatKrw(simulation.totalAppliedDeductionKrw)}</strong></li>
              <li><span>{copy.summaryTaxableAnnualIncome}</span><strong>{formatKrw(simulation.taxableAnnualIncomeKrw)}</strong></li>
              <li><span>{copy.summaryAppliedTaxCredit}</span><strong>{formatKrw(simulation.totalAppliedTaxCreditKrw)}</strong></li>
              <li><span>{copy.summaryEstimatedLiability}</span><strong>{formatKrw(simulation.annualTaxLiabilityKrw)}</strong></li>
              <li><span>{copy.summaryBaselineLiability}</span><strong>{formatKrw(simulation.baselineTaxLiabilityKrw)}</strong></li>
              <li><span>{copy.summaryLiabilityChange}</span><strong>{formatKrw(simulation.liabilityChangeKrw)}</strong></li>
              <li><span>{copy.summaryWithholdingDelta}</span><strong>{formatKrw(simulation.withholdingDeltaKrw)}</strong></li>
              <li><span>{copy.summaryAdditionalDueRefund}</span><strong>{formatKrw(simulation.additionalWithholdingDueKrw)} / {formatKrw(simulation.withholdingRefundKrw)}</strong></li>
            </ul>
          )}
          <p className="small">{copy.capsGuide}</p>
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
