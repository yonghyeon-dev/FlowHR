"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import type {
  ApiLog,
  PayrollYearEndInsuranceReconciliationReportResponse,
  PayrollYearEndRecalculationResponse,
  PayrollWithholdingReceiptResponse,
  PayrollYearEndSettlementResponse
} from "@/components/payroll-year-end/types";
import { currentYear, formatKrw } from "@/components/payroll-year-end/types";

function parseRequiredInt(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} must be a non-negative integer`);
  }
  return parsed;
}

function parseRate(value: string, fieldName: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${fieldName} must be between 0 and 1`);
  }
  return parsed;
}

const deductionItemLabels: Record<string, string> = {
  personalPensionKrw: "Personal Pension",
  insurancePremiumKrw: "Insurance Premium",
  medicalExpenseKrw: "Medical Expense",
  educationExpenseKrw: "Education Expense",
  donationKrw: "Donation",
  housingSavingsKrw: "Housing Savings"
};

function summarizeCappedDeductionItems(
  capAppliedByItemKrw: PayrollYearEndRecalculationResponse["recalculation"]["deductionItemsKrw"]["capAppliedByItemKrw"]
) {
  const cappedLines = Object.entries(capAppliedByItemKrw)
    .filter(([, value]) => value.capped)
    .map(([key, value]) => {
      const label = deductionItemLabels[key] ?? key;
      return `${label}: ${formatKrw(value.inputKrw)} -> ${formatKrw(value.appliedKrw)} (cap ${formatKrw(value.capKrw)}) [${value.applicationReasonCode}]`;
    });
  return cappedLines.length ? cappedLines.join(" | ") : "-";
}

function summarizeDeductionReasonCodes(
  capAppliedByItemKrw: PayrollYearEndRecalculationResponse["recalculation"]["deductionItemsKrw"]["capAppliedByItemKrw"]
) {
  return Object.entries(capAppliedByItemKrw)
    .map(([key, value]) => {
      const label = deductionItemLabels[key] ?? key;
      return `${label}:${value.applicationReasonCode}`;
    })
    .join(" | ");
}

const taxCreditItemLabels: Record<string, string> = {
  earnedIncomeTaxCreditKrw: "Earned Income Credit",
  childTaxCreditKrw: "Child Credit",
  additionalTaxCreditKrw: "Additional Credit"
};

function summarizeCappedTaxCreditItems(
  capAppliedByItemKrw: PayrollYearEndSettlementResponse["summary"]["settlementKrw"]["taxCreditAppliedByItemKrw"]
) {
  const cappedLines = Object.entries(capAppliedByItemKrw)
    .filter(([, value]) => value.capped)
    .map(([key, value]) => {
      const label = taxCreditItemLabels[key] ?? key;
      return `${label}: ${formatKrw(value.inputKrw)} -> ${formatKrw(value.appliedKrw)} (cap ${formatKrw(value.capKrw)}) [${value.applicationReasonCode}]`;
    });
  return cappedLines.length ? cappedLines.join(" | ") : "-";
}

function summarizeTaxCreditReasonCodes(
  capAppliedByItemKrw: PayrollYearEndSettlementResponse["summary"]["settlementKrw"]["taxCreditAppliedByItemKrw"]
) {
  return Object.entries(capAppliedByItemKrw)
    .map(([key, value]) => {
      const label = taxCreditItemLabels[key] ?? key;
      return `${label}:${value.applicationReasonCode}`;
    })
    .join(" | ");
}

export default function PayrollYearEndConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [year, setYear] = useState(String(currentYear()));
  const [nonTaxableAnnualIncomeKrw, setNonTaxableAnnualIncomeKrw] = useState("0");
  const [earnedIncomeTaxCreditKrw, setEarnedIncomeTaxCreditKrw] = useState("0");
  const [childTaxCreditKrw, setChildTaxCreditKrw] = useState("0");
  const [additionalTaxCreditKrw, setAdditionalTaxCreditKrw] = useState("0");
  const [annualIncomeTaxRate, setAnnualIncomeTaxRate] = useState("0.03");
  const [localIncomeTaxRate, setLocalIncomeTaxRate] = useState("0.1");
  const [personalPensionKrw, setPersonalPensionKrw] = useState("0");
  const [insurancePremiumKrw, setInsurancePremiumKrw] = useState("0");
  const [medicalExpenseKrw, setMedicalExpenseKrw] = useState("0");
  const [educationExpenseKrw, setEducationExpenseKrw] = useState("0");
  const [donationKrw, setDonationKrw] = useState("0");
  const [housingSavingsKrw, setHousingSavingsKrw] = useState("0");
  const [personalPensionEligible, setPersonalPensionEligible] = useState(true);
  const [insurancePremiumEligible, setInsurancePremiumEligible] = useState(true);
  const [medicalExpenseEligible, setMedicalExpenseEligible] = useState(true);
  const [educationExpenseEligible, setEducationExpenseEligible] = useState(true);
  const [donationEligible, setDonationEligible] = useState(true);
  const [housingSavingsEligible, setHousingSavingsEligible] = useState(true);
  const [issuerName, setIssuerName] = useState("payroll-team");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [settlement, setSettlement] = useState<PayrollYearEndSettlementResponse | null>(null);
  const [recalculation, setRecalculation] = useState<PayrollYearEndRecalculationResponse | null>(null);
  const [insuranceReconciliationReport, setInsuranceReconciliationReport] =
    useState<PayrollYearEndInsuranceReconciliationReportResponse | null>(null);
  const [receipt, setReceipt] = useState<PayrollWithholdingReceiptResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);

  function buildHeaders() {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (usesBearerToken) {
      headers.authorization = `Bearer ${bearerToken}`;
    } else {
      headers["x-actor-role"] = "payroll_operator";
      headers["x-actor-id"] = adminActorId.trim() || "PAY-1001";
      if (organizationId.trim()) {
        headers["x-actor-organization-id"] = organizationId.trim();
      }
    }
    return headers;
  }

  async function runSettlementPreview() {
    try {
      setPendingLabel("year-end settlement preview");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        nonTaxableAnnualIncomeKrw: parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
          "nonTaxableAnnualIncomeKrw"
        ),
        additionalTaxCreditKrw: parseRequiredInt(additionalTaxCreditKrw, "additionalTaxCreditKrw"),
        taxCredits: {
          earnedIncomeTaxCreditKrw: parseRequiredInt(
            earnedIncomeTaxCreditKrw,
            "taxCredits.earnedIncomeTaxCreditKrw"
          ),
          childTaxCreditKrw: parseRequiredInt(childTaxCreditKrw, "taxCredits.childTaxCreditKrw"),
          additionalTaxCreditKrw: parseRequiredInt(
            additionalTaxCreditKrw,
            "taxCredits.additionalTaxCreditKrw"
          )
        },
        annualIncomeTaxRate: parseRate(annualIncomeTaxRate, "annualIncomeTaxRate"),
        localIncomeTaxRate: parseRate(localIncomeTaxRate, "localIncomeTaxRate")
      };
      const response = await fetch("/api/payroll/year-end/preview-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndSettlementResponse | { error: string };
      setLogs((prev) => [
        { id: Date.now(), label: "preview year-end settlement", status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setSettlement(body);
      setStatusMessage(`loaded annual liability ${formatKrw(body.summary.settlementKrw.annualTaxLiabilityKrw)}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runSettlementRecalculation() {
    try {
      setPendingLabel("year-end settlement recalculation");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        nonTaxableAnnualIncomeKrw: parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
          "nonTaxableAnnualIncomeKrw"
        ),
        additionalTaxCreditKrw: parseRequiredInt(additionalTaxCreditKrw, "additionalTaxCreditKrw"),
        taxCredits: {
          earnedIncomeTaxCreditKrw: parseRequiredInt(
            earnedIncomeTaxCreditKrw,
            "taxCredits.earnedIncomeTaxCreditKrw"
          ),
          childTaxCreditKrw: parseRequiredInt(childTaxCreditKrw, "taxCredits.childTaxCreditKrw"),
          additionalTaxCreditKrw: parseRequiredInt(
            additionalTaxCreditKrw,
            "taxCredits.additionalTaxCreditKrw"
          )
        },
        annualIncomeTaxRate: parseRate(annualIncomeTaxRate, "annualIncomeTaxRate"),
        localIncomeTaxRate: parseRate(localIncomeTaxRate, "localIncomeTaxRate"),
        deductionEligibility: {
          personalPensionEligible,
          insurancePremiumEligible,
          medicalExpenseEligible,
          educationExpenseEligible,
          donationEligible,
          housingSavingsEligible
        },
        deductionItems: {
          personalPensionKrw: parseRequiredInt(personalPensionKrw, "personalPensionKrw"),
          insurancePremiumKrw: parseRequiredInt(insurancePremiumKrw, "insurancePremiumKrw"),
          medicalExpenseKrw: parseRequiredInt(medicalExpenseKrw, "medicalExpenseKrw"),
          educationExpenseKrw: parseRequiredInt(educationExpenseKrw, "educationExpenseKrw"),
          donationKrw: parseRequiredInt(donationKrw, "donationKrw"),
          housingSavingsKrw: parseRequiredInt(housingSavingsKrw, "housingSavingsKrw")
        }
      };
      const response = await fetch("/api/payroll/year-end/recalculate-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndRecalculationResponse | { error: string };
      setLogs((prev) => [
        { id: Date.now(), label: "recalculate year-end settlement", status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setRecalculation(body);
      setStatusMessage(
        `recalculated tax delta ${formatKrw(body.recalculation.deltaKrw.annualTaxLiabilityDeltaKrw)}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runReceipt(issue: boolean) {
    try {
      setPendingLabel(issue ? "withholding receipt issue" : "withholding receipt preview");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        issue,
        issuerName: issuerName.trim() || undefined
      };
      const response = await fetch("/api/payroll/year-end/withholding-receipts", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollWithholdingReceiptResponse | { error: string };
      setLogs((prev) => [
        { id: Date.now(), label: issue ? "issue withholding receipt" : "preview withholding receipt", status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setReceipt(body);
      setStatusMessage(body.receipt.issued ? `issued ${body.receipt.receiptNumber}` : `previewed ${body.receipt.receiptNumber}`);
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runLoadInsuranceReconciliationReport() {
    try {
      setPendingLabel("year-end insurance reconciliation report");
      const requestYear = parseRequiredInt(year, "year");
      const requestEmployeeId = employeeId.trim();
      const query = new URLSearchParams({
        year: String(requestYear),
        employeeId: requestEmployeeId
      });
      const response = await fetch(
        `/api/payroll/year-end/insurance-reconciliation-report?${query.toString()}`,
        {
          method: "GET",
          headers: buildHeaders()
        }
      );
      const body = (await response.json()) as
        | PayrollYearEndInsuranceReconciliationReportResponse
        | { error: string };
      setLogs((prev) => [
        { id: Date.now(), label: "year-end insurance reconciliation report", status: response.status, ok: response.ok, at: new Date().toLocaleString("ko-KR") },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage("request failed; check logs");
        return;
      }
      setInsuranceReconciliationReport(body);
      setStatusMessage(
        `loaded insurance reconciliation (${body.report.reconciliation.status}, delta ${formatKrw(body.report.reconciliation.deltaKrw)})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  return (
    <main className="saas-content">
      <header className="hero">
        <p className="eyebrow">FlowHR Admin</p>
        <h1>Payroll Year-End and Withholding Receipt</h1>
        <p>Preview annual settlement and issue employee withholding receipts with payroll compliance guards.</p>
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
            <label>Annual Income Tax Rate<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>Local Income Tax Rate<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
            <label>Issuer Name<input value={issuerName} onChange={(event) => setIssuerName(event.target.value)} /></label>
            <label>Personal Pension<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>Insurance Premium<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>Medical Expense<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>Education Expense<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>Donation<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>Housing Savings<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label className="checkbox"><input type="checkbox" checked={personalPensionEligible} onChange={(event) => setPersonalPensionEligible(event.target.checked)} />Personal Pension Eligible</label>
            <label className="checkbox"><input type="checkbox" checked={insurancePremiumEligible} onChange={(event) => setInsurancePremiumEligible(event.target.checked)} />Insurance Premium Eligible</label>
            <label className="checkbox"><input type="checkbox" checked={medicalExpenseEligible} onChange={(event) => setMedicalExpenseEligible(event.target.checked)} />Medical Expense Eligible</label>
            <label className="checkbox"><input type="checkbox" checked={educationExpenseEligible} onChange={(event) => setEducationExpenseEligible(event.target.checked)} />Education Expense Eligible</label>
            <label className="checkbox"><input type="checkbox" checked={donationEligible} onChange={(event) => setDonationEligible(event.target.checked)} />Donation Eligible</label>
            <label className="checkbox"><input type="checkbox" checked={housingSavingsEligible} onChange={(event) => setHousingSavingsEligible(event.target.checked)} />Housing Savings Eligible</label>
          </div>
          <label>Access Token (optional)<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>Actor ID (dev fallback)<input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} /></label>
          <label>Organization ID (dev fallback)<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runSettlementPreview()} disabled={pendingLabel !== null}>Preview Settlement</button>
            <button className="btn btn-secondary" onClick={() => void runSettlementRecalculation()} disabled={pendingLabel !== null}>Recalculate Settlement</button>
            <button className="btn btn-secondary" onClick={() => void runLoadInsuranceReconciliationReport()} disabled={pendingLabel !== null}>Load Insurance Reconciliation</button>
            <button className="btn btn-secondary" onClick={() => void runReceipt(false)} disabled={pendingLabel !== null}>Preview Receipt</button>
            <button className="btn btn-primary" onClick={() => void runReceipt(true)} disabled={pendingLabel !== null}>Issue Receipt</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>
        <article className="panel">
          <h2>Settlement</h2>
          {!settlement ? <p className="small">No settlement yet.</p> : (
            <ul className="simple-list">
              <li><span>Gross / Net</span><strong>{formatKrw(settlement.summary.annualTotalsKrw.grossPayKrw)} / {formatKrw(settlement.summary.annualTotalsKrw.netPayKrw)}</strong></li>
              <li><span>Tax Credit Input / Applied</span><strong>{formatKrw(settlement.summary.settlementKrw.totalTaxCreditInputKrw)}{" / "}{formatKrw(settlement.summary.settlementKrw.totalTaxCreditAppliedKrw)}</strong></li>
              <li><span>Capped Tax Credits</span><strong>{summarizeCappedTaxCreditItems(settlement.summary.settlementKrw.taxCreditAppliedByItemKrw)}</strong></li>
              <li><span>Tax Credit Reason Codes</span><strong>{summarizeTaxCreditReasonCodes(settlement.summary.settlementKrw.taxCreditAppliedByItemKrw)}</strong></li>
              <li><span>Tax Liability</span><strong>{formatKrw(settlement.summary.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Prior Withheld</span><strong>{formatKrw(settlement.summary.settlementKrw.priorWithheldTaxKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(settlement.summary.settlementKrw.withholdingDeltaKrw)}</strong></li>
              <li><span>Additional Withholding Due</span><strong>{formatKrw(settlement.summary.settlementKrw.additionalWithholdingDueKrw)}</strong></li>
              <li><span>Withholding Refund</span><strong>{formatKrw(settlement.summary.settlementKrw.withholdingRefundKrw)}</strong></li>
              <li><span>Previewed Runs</span><strong>{settlement.summary.runStates.previewedRunIds.join(", ") || "-"}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>Recalculation</h2>
          {!recalculation ? <p className="small">No recalculation yet.</p> : (
            <ul className="simple-list">
              <li><span>Income Deduction Input</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.totalIncomeDeductionKrw)}</strong></li>
              <li><span>Capped Deduction</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.cappedIncomeDeductionKrw)}</strong></li>
              <li><span>Applied Deduction</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.appliedIncomeDeductionKrw)}</strong></li>
              <li><span>Tax Credit Input / Applied</span><strong>{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.totalTaxCreditInputKrw)}{" / "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.totalTaxCreditAppliedKrw)}</strong></li>
              <li><span>Capped Tax Credits</span><strong>{summarizeCappedTaxCreditItems(recalculation.recalculation.recalculatedSettlementKrw.taxCreditAppliedByItemKrw)}</strong></li>
              <li><span>Tax Credit Reason Codes</span><strong>{summarizeTaxCreditReasonCodes(recalculation.recalculation.recalculatedSettlementKrw.taxCreditAppliedByItemKrw)}</strong></li>
              <li><span>Taxable Income</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.taxableAnnualIncomeBeforeDeductionKrw)}{" -> "}{formatKrw(recalculation.recalculation.deductionItemsKrw.taxableAnnualIncomeAfterDeductionKrw)}</strong></li>
              <li><span>Capped Items</span><strong>{summarizeCappedDeductionItems(recalculation.recalculation.deductionItemsKrw.capAppliedByItemKrw)}</strong></li>
              <li><span>Deduction Reason Codes</span><strong>{summarizeDeductionReasonCodes(recalculation.recalculation.deductionItemsKrw.capAppliedByItemKrw)}</strong></li>
              <li><span>Deduction Eligibility</span><strong>{Object.entries(recalculation.recalculation.deductionEligibility).filter(([, value]) => value).map(([key]) => key).join(", ") || "-"}</strong></li>
              <li><span>Eligibility Blocking Reasons</span><strong>{recalculation.recalculation.deductionEligibilityBlockingReasons.join(" | ") || "-"}</strong></li>
              <li><span>Tax Liability</span><strong>{formatKrw(recalculation.recalculation.baselineSettlementKrw.annualTaxLiabilityKrw)}{" -> "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Tax Liability Delta</span><strong>{formatKrw(recalculation.recalculation.deltaKrw.annualTaxLiabilityDeltaKrw)}</strong></li>
              <li><span>Withholding Delta Change</span><strong>{formatKrw(recalculation.recalculation.deltaKrw.withholdingDeltaChangeKrw)}</strong></li>
              <li><span>Additional Due</span><strong>{formatKrw(recalculation.recalculation.baselineSettlementKrw.additionalWithholdingDueKrw)}{" -> "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.additionalWithholdingDueKrw)}</strong></li>
              <li><span>Refund</span><strong>{formatKrw(recalculation.recalculation.baselineSettlementKrw.withholdingRefundKrw)}{" -> "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.withholdingRefundKrw)}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>Insurance Reconciliation</h2>
          {!insuranceReconciliationReport ? <p className="small">No reconciliation report yet.</p> : (
            <ul className="simple-list">
              <li><span>Status</span><strong>{insuranceReconciliationReport.report.reconciliation.status}</strong></li>
              <li><span>Annual Social Insurance (Runs)</span><strong>{formatKrw(insuranceReconciliationReport.report.annualRunSocialInsuranceKrw)}</strong></li>
              <li><span>Compared Insurance Premium (Finalization)</span><strong>{formatKrw(insuranceReconciliationReport.report.reconciliation.comparedKrw)}</strong></li>
              <li><span>Delta</span><strong>{formatKrw(insuranceReconciliationReport.report.reconciliation.deltaKrw)}</strong></li>
              <li><span>Finalization / Hash</span><strong>{insuranceReconciliationReport.report.finalization.finalizationId ?? "-"} / {insuranceReconciliationReport.report.finalization.settlementHash?.slice(0, 12) ?? "-"}</strong></li>
              <li><span>Insurance Reason Code</span><strong>{insuranceReconciliationReport.report.finalization.applicationReasonCode ?? "-"}</strong></li>
              <li><span>Monthly Breakdown</span><strong>{insuranceReconciliationReport.report.monthlyBreakdown.map((row) => `${row.month}:${formatKrw(row.socialInsuranceKrw)}`).join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>Withholding Receipt</h2>
          {!receipt ? <p className="small">No receipt summary yet.</p> : (
            <ul className="simple-list">
              <li><span>Receipt Number</span><strong>{receipt.receipt.receiptNumber}</strong></li>
              <li><span>Can Issue / Issued</span><strong>{receipt.receipt.canIssue ? "YES" : "NO"} / {receipt.receipt.issued ? "YES" : "NO"}</strong></li>
              <li><span>Issued At</span><strong>{receipt.receipt.issuedAt ?? "-"}</strong></li>
              <li><span>Pending Receipt Runs</span><strong>{receipt.receipt.runStates.pendingReceiptRunIds.join(", ") || "-"}</strong></li>
              <li><span>Blocking Reasons</span><strong>{receipt.receipt.blockingReasons.join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>API Logs</h2>
          <p className="small">total {stats.total} / success {stats.success} / fail {stats.fail}{pendingLabel ? ` / running ${pendingLabel}` : ""}</p>
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
            <Link href="/admin" className="btn btn-secondary">Back to Admin</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
