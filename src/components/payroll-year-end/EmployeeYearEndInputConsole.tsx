"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { FinalizedYearEndSettlementResponse } from "@/components/withholding-receipt/types";
import { currentYear, formatKrw } from "@/components/withholding-receipt/types";
import { useI18n } from "@/lib/i18n/provider";
import { isTruthyFlag } from "@/app/admin/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import {
  buildEmployeeYearEndAccuracyGuidance,
  buildEmployeeYearEndSimulation,
  isNonNegativeIntegerText,
  parseNonNegativeInt
} from "@/components/payroll-year-end/employee-year-end-input-helpers";
import { employeeYearEndInputCopyByLocale } from "@/components/payroll-year-end/employee-year-end-input-copy";
import {
  extractPayrollYearEndErrorMessage,
  normalizePayrollYearEndRuntimeMessage
} from "@/components/payroll-year-end/runtime-copy-helpers";

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  at: string;
};

export default function EmployeeYearEndInputConsole() {
  const { locale } = useI18n();
  const copy = employeeYearEndInputCopyByLocale[locale];
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const isProductionRuntime = process.env.NODE_ENV === "production";
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const employeeId = (supabaseSession?.actorId ?? supabaseSession?.userId ?? "EMP-1001").trim() || "EMP-1001";

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

  const normalizedSupabaseSessionError = useMemo(() => {
    if (!supabaseSessionError) {
      return null;
    }
    return normalizePayrollYearEndRuntimeMessage(
      supabaseSessionError,
      locale,
      "인증 세션 상태를 확인하지 못했습니다."
    );
  }, [locale, supabaseSessionError]);
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
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
        setStatusMessage(
          extractPayrollYearEndErrorMessage(body, locale, copy.requestFailedCheckLogsStatus)
        );
        return;
      }
      setFinalizedSettlement(body);
      setStatusMessage(`${copy.loadedStatusPrefix} ${body.settlement.finalizationId}`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? normalizePayrollYearEndRuntimeMessage(error.message, locale, copy.requestFailedStatus)
          : copy.requestFailedStatus
      );
    } finally {
      setPendingLabel(null);
    }
  }

  const simulation = useMemo(
    () =>
      buildEmployeeYearEndSimulation({
        finalizedSettlement,
        nonTaxableAnnualIncomeKrw,
        earnedIncomeTaxCreditKrw,
        childTaxCreditKrw,
        additionalTaxCreditKrw,
        personalPensionKrw,
        insurancePremiumKrw,
        medicalExpenseKrw,
        educationExpenseKrw,
        donationKrw,
        housingSavingsKrw,
        annualIncomeTaxRate,
        localIncomeTaxRate
      }),
    [
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
    ]
  );

  const accuracyGuidanceItems = useMemo(
    () =>
      buildEmployeeYearEndAccuracyGuidance({
        copy,
        runtimeLocale,
        finalizedSettlement,
        nonTaxableWithinGrossValid,
        simulation,
        earnedIncomeTaxCreditKrw,
        childTaxCreditKrw,
        additionalTaxCreditKrw,
        personalPensionKrw,
        insurancePremiumKrw,
        medicalExpenseKrw,
        educationExpenseKrw,
        donationKrw,
        housingSavingsKrw
      }),
    [
      additionalTaxCreditKrw,
      childTaxCreditKrw,
      copy,
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
    ]
  );

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
          <p className="small muted">
            {locale === "ko" ? "세션 조직" : "Session organization"}: <code>{organizationId || "-"}</code> /{" "}
            {locale === "ko" ? "세션 직원" : "Session employee"}: <code>{employeeId || "-"}</code>
          </p>
          <div className="input-grid">
            <label>{copy.yearLabel}<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
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
          {normalizedSupabaseSessionError ? (
            <p className="small fail">
              {copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}
            </p>
          ) : null}
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
        {showDevTools ? (
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
        ) : null}
      </section>
    </main>
  );
}
