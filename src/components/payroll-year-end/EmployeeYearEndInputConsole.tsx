"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { FinalizedYearEndSettlementResponse } from "@/components/withholding-receipt/types";
import { currentYear, formatKrw } from "@/components/withholding-receipt/types";
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

export default function EmployeeYearEndInputConsole() {
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
    setPendingLabel("finalized settlement");
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
          label: "load finalized settlement",
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString("ko-KR")
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setFinalizedSettlement(body);
      setStatusMessage(`loaded ${body.settlement.finalizationId}`);
      setTimeout(() => setStatusMessage(null), 2500);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "request failed");
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
        <p className="eyebrow">FlowHR Employee</p>
        <h1>Year-End Input Simulator</h1>
        <p>Load your finalized settlement and simulate deduction/tax-credit input effects before HR submission.</p>
      </header>
      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <div className="input-grid">
            <label>Year<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>Employee ID<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>Non-taxable Annual Income<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
            <label>Earned Income Tax Credit<input value={earnedIncomeTaxCreditKrw} onChange={(event) => setEarnedIncomeTaxCreditKrw(event.target.value)} /></label>
            <label>Child Tax Credit<input value={childTaxCreditKrw} onChange={(event) => setChildTaxCreditKrw(event.target.value)} /></label>
            <label>Additional Tax Credit<input value={additionalTaxCreditKrw} onChange={(event) => setAdditionalTaxCreditKrw(event.target.value)} /></label>
            <label>Personal Pension<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>Insurance Premium<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>Medical Expense<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>Education Expense<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>Donation<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>Housing Savings<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label>Annual Income Tax Rate<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>Local Income Tax Rate<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
          </div>
          <label>Access Token (optional)<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>Organization ID (dev fallback)<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-primary" onClick={() => void loadFinalizedSettlement()} disabled={pendingLabel !== null}>
              Load Finalized Settlement
            </button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>Simulation Result</h2>
          {!simulation ? <p className="small">Load finalized settlement first.</p> : (
            <ul className="simple-list">
              <li><span>Finalization</span><strong>{finalizedSettlement?.settlement.finalizationId}</strong></li>
              <li><span>Gross Pay</span><strong>{formatKrw(simulation.annualGrossPayKrw)}</strong></li>
              <li><span>Applied Deduction</span><strong>{formatKrw(simulation.totalAppliedDeductionKrw)}</strong></li>
              <li><span>Taxable Annual Income</span><strong>{formatKrw(simulation.taxableAnnualIncomeKrw)}</strong></li>
              <li><span>Applied Tax Credit</span><strong>{formatKrw(simulation.totalAppliedTaxCreditKrw)}</strong></li>
              <li><span>Estimated Liability</span><strong>{formatKrw(simulation.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Baseline Liability</span><strong>{formatKrw(simulation.baselineTaxLiabilityKrw)}</strong></li>
              <li><span>Liability Change</span><strong>{formatKrw(simulation.liabilityChangeKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(simulation.withholdingDeltaKrw)}</strong></li>
              <li><span>Additional Due / Refund</span><strong>{formatKrw(simulation.additionalWithholdingDueKrw)} / {formatKrw(simulation.withholdingRefundKrw)}</strong></li>
            </ul>
          )}
          <p className="small">
            Caps: deduction(personal pension 7,000,000 / insurance 1,000,000 / medical 15,000,000 / education 9,000,000 / donation 10,000,000 / housing 4,000,000),
            tax credit(earned 740,000 / child 900,000 / additional 1,000,000).
          </p>
        </article>
        <article className="panel">
          <h2>API Logs</h2>
          <p className="small">
            total {logs.length}
            {pendingLabel ? ` / running ${pendingLabel}` : ""}
          </p>
          {logs.length === 0 ? <p className="small">No API call yet.</p> : (
            <ul className="log-list">
              {logs.map((log) => (
                <li key={log.id}>
                  <span className={log.ok ? "ok" : "fail"}>{log.ok ? "OK" : "FAIL"}</span> {log.label} / {log.status}
                  <time>{log.at}</time>
                </li>
              ))}
            </ul>
          )}
          <div className="panel-actions">
            <Link href="/employee/withholding-receipt" className="btn btn-secondary">Open Withholding Receipt</Link>
            <Link href="/employee" className="btn btn-secondary">Back to Employee</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
