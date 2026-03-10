"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { payrollYearEndCopyByLocale } from "@/components/payroll-year-end/copy";
import { PayrollAccuracyEvidencePanel } from "@/components/payroll-year-end/PayrollAccuracyEvidencePanel";
import { buildPayrollYearEndFailureMessage } from "@/components/payroll-year-end/request-failure-guidance";
import {
  normalizePayrollYearEndRuntimeMessage,
  resolvePayrollYearEndBlockingReasons,
  resolvePayrollYearEndReasonCodeLabel,
  resolvePayrollYearEndReconciliationStatusLabel
} from "@/components/payroll-year-end/runtime-copy-helpers";
import { isTruthyFlag } from "@/app/admin/page-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";
import type {
  ApiLog,
  PayrollYearEndInsuranceReconciliationReportResponse,
  PayrollYearEndRecalculationResponse,
  PayrollWithholdingReceiptResponse,
  PayrollYearEndSettlementResponse
} from "@/components/payroll-year-end/types";
import { currentYear, formatKrw } from "@/components/payroll-year-end/types";

function parseRequiredInt(value: string, fieldName: string, nonNegativeIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldName} ${nonNegativeIntegerLabel}`);
  }
  return parsed;
}

function parseRate(value: string, fieldName: string, rateBetweenZeroAndOneLabel: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
    throw new Error(`${fieldName} ${rateBetweenZeroAndOneLabel}`);
  }
  return parsed;
}

function summarizeCappedDeductionItems(
  capAppliedByItemKrw: PayrollYearEndRecalculationResponse["recalculation"]["deductionItemsKrw"]["capAppliedByItemKrw"],
  deductionItemLabels: Record<string, string>,
  runtimeLocale: string,
  capLabel: string,
  locale: "ko" | "en"
) {
  const cappedLines = Object.entries(capAppliedByItemKrw)
    .filter(([, value]) => value.capped)
    .map(([key, value]) => {
      const label = deductionItemLabels[key] ?? key;
      return `${label}: ${formatKrw(value.inputKrw, runtimeLocale)} -> ${formatKrw(value.appliedKrw, runtimeLocale)} (${capLabel} ${formatKrw(value.capKrw, runtimeLocale)}) [${resolvePayrollYearEndReasonCodeLabel(value.applicationReasonCode, locale)}]`;
    });
  return cappedLines.length ? cappedLines.join(" | ") : "-";
}

function summarizeDeductionReasonCodes(
  capAppliedByItemKrw: PayrollYearEndRecalculationResponse["recalculation"]["deductionItemsKrw"]["capAppliedByItemKrw"],
  deductionItemLabels: Record<string, string>,
  locale: "ko" | "en"
) {
  return Object.entries(capAppliedByItemKrw)
    .map(([key, value]) => {
      const label = deductionItemLabels[key] ?? key;
      return `${label}:${resolvePayrollYearEndReasonCodeLabel(value.applicationReasonCode, locale)}`;
    })
    .join(" | ");
}

function summarizeCappedTaxCreditItems(
  capAppliedByItemKrw: PayrollYearEndSettlementResponse["summary"]["settlementKrw"]["taxCreditAppliedByItemKrw"],
  taxCreditItemLabels: Record<string, string>,
  runtimeLocale: string,
  capLabel: string,
  locale: "ko" | "en"
) {
  const cappedLines = Object.entries(capAppliedByItemKrw)
    .filter(([, value]) => value.capped)
    .map(([key, value]) => {
      const label = taxCreditItemLabels[key] ?? key;
      return `${label}: ${formatKrw(value.inputKrw, runtimeLocale)} -> ${formatKrw(value.appliedKrw, runtimeLocale)} (${capLabel} ${formatKrw(value.capKrw, runtimeLocale)}) [${resolvePayrollYearEndReasonCodeLabel(value.applicationReasonCode, locale)}]`;
    });
  return cappedLines.length ? cappedLines.join(" | ") : "-";
}

function summarizeTaxCreditReasonCodes(
  capAppliedByItemKrw: PayrollYearEndSettlementResponse["summary"]["settlementKrw"]["taxCreditAppliedByItemKrw"],
  taxCreditItemLabels: Record<string, string>,
  locale: "ko" | "en"
) {
  return Object.entries(capAppliedByItemKrw)
    .map(([key, value]) => {
      const label = taxCreditItemLabels[key] ?? key;
      return `${label}:${resolvePayrollYearEndReasonCodeLabel(value.applicationReasonCode, locale)}`;
    })
    .join(" | ");
}

export default function PayrollYearEndConsole() {
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
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "PAY-1001").trim() || "PAY-1001";
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollYearEndCopyByLocale[locale];
  const bearerToken = isProductionRuntime ? (supabaseSession?.accessToken ?? "") : "";
  const usesBearerToken = bearerToken.trim().length > 0;

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    return { total, success, fail: total - success };
  }, [logs]);
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
      setPendingLabel(copy.pendingSettlementPreview);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusNonNegativeInteger),
        employeeId: employeeId.trim(),
        nonTaxableAnnualIncomeKrw: parseRequiredInt(
          nonTaxableAnnualIncomeKrw,
          copy.nonTaxableAnnualIncomeLabel,
          copy.statusNonNegativeInteger
        ),
        additionalTaxCreditKrw: parseRequiredInt(
          additionalTaxCreditKrw,
          copy.additionalTaxCreditLabel,
          copy.statusNonNegativeInteger
        ),
        taxCredits: {
          earnedIncomeTaxCreditKrw: parseRequiredInt(
            earnedIncomeTaxCreditKrw,
            copy.earnedIncomeTaxCreditLabel,
            copy.statusNonNegativeInteger
          ),
          childTaxCreditKrw: parseRequiredInt(
            childTaxCreditKrw,
            copy.childTaxCreditLabel,
            copy.statusNonNegativeInteger
          ),
          additionalTaxCreditKrw: parseRequiredInt(
            additionalTaxCreditKrw,
            copy.additionalTaxCreditLabel,
            copy.statusNonNegativeInteger
          )
        },
        annualIncomeTaxRate: parseRate(
          annualIncomeTaxRate,
          copy.annualIncomeTaxRateLabel,
          copy.statusRateBetweenZeroAndOne
        ),
        localIncomeTaxRate: parseRate(
          localIncomeTaxRate,
          copy.localIncomeTaxRateLabel,
          copy.statusRateBetweenZeroAndOne
        )
      };
      const response = await fetch("/api/payroll/year-end/preview-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndSettlementResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logPreviewSettlement,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(
          buildPayrollYearEndFailureMessage({
            status: response.status,
            body,
            locale,
            fallback: copy.statusRequestFailed
          })
        );
        return;
      }
      setSettlement(body);
      setStatusMessage(
        `${copy.statusLoadedAnnualLiabilityPrefix} ${formatKrw(body.summary.settlementKrw.annualTaxLiabilityKrw, runtimeLocale)}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? normalizePayrollYearEndRuntimeMessage(error.message, locale, copy.statusInvalidInput)
          : copy.statusInvalidInput
      );
    } finally {
      setPendingLabel(null);
    }
  }

  async function runSettlementRecalculation() {
    try {
      setPendingLabel(copy.pendingSettlementRecalculation);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusNonNegativeInteger),
        employeeId: employeeId.trim(),
        nonTaxableAnnualIncomeKrw: parseRequiredInt(
          nonTaxableAnnualIncomeKrw,
          copy.nonTaxableAnnualIncomeLabel,
          copy.statusNonNegativeInteger
        ),
        additionalTaxCreditKrw: parseRequiredInt(
          additionalTaxCreditKrw,
          copy.additionalTaxCreditLabel,
          copy.statusNonNegativeInteger
        ),
        taxCredits: {
          earnedIncomeTaxCreditKrw: parseRequiredInt(
            earnedIncomeTaxCreditKrw,
            copy.earnedIncomeTaxCreditLabel,
            copy.statusNonNegativeInteger
          ),
          childTaxCreditKrw: parseRequiredInt(
            childTaxCreditKrw,
            copy.childTaxCreditLabel,
            copy.statusNonNegativeInteger
          ),
          additionalTaxCreditKrw: parseRequiredInt(
            additionalTaxCreditKrw,
            copy.additionalTaxCreditLabel,
            copy.statusNonNegativeInteger
          )
        },
        annualIncomeTaxRate: parseRate(
          annualIncomeTaxRate,
          copy.annualIncomeTaxRateLabel,
          copy.statusRateBetweenZeroAndOne
        ),
        localIncomeTaxRate: parseRate(
          localIncomeTaxRate,
          copy.localIncomeTaxRateLabel,
          copy.statusRateBetweenZeroAndOne
        ),
        deductionEligibility: {
          personalPensionEligible,
          insurancePremiumEligible,
          medicalExpenseEligible,
          educationExpenseEligible,
          donationEligible,
          housingSavingsEligible
        },
        deductionItems: {
          personalPensionKrw: parseRequiredInt(
            personalPensionKrw,
            copy.personalPensionLabel,
            copy.statusNonNegativeInteger
          ),
          insurancePremiumKrw: parseRequiredInt(
            insurancePremiumKrw,
            copy.insurancePremiumLabel,
            copy.statusNonNegativeInteger
          ),
          medicalExpenseKrw: parseRequiredInt(
            medicalExpenseKrw,
            copy.medicalExpenseLabel,
            copy.statusNonNegativeInteger
          ),
          educationExpenseKrw: parseRequiredInt(
            educationExpenseKrw,
            copy.educationExpenseLabel,
            copy.statusNonNegativeInteger
          ),
          donationKrw: parseRequiredInt(donationKrw, copy.donationLabel, copy.statusNonNegativeInteger),
          housingSavingsKrw: parseRequiredInt(
            housingSavingsKrw,
            copy.housingSavingsLabel,
            copy.statusNonNegativeInteger
          )
        }
      };
      const response = await fetch("/api/payroll/year-end/recalculate-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndRecalculationResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logRecalculateSettlement,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(
          buildPayrollYearEndFailureMessage({
            status: response.status,
            body,
            locale,
            fallback: copy.statusRequestFailed
          })
        );
        return;
      }
      setRecalculation(body);
      setStatusMessage(
        `${copy.statusRecalculatedTaxDeltaPrefix} ${formatKrw(body.recalculation.deltaKrw.annualTaxLiabilityDeltaKrw, runtimeLocale)}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? normalizePayrollYearEndRuntimeMessage(error.message, locale, copy.statusInvalidInput)
          : copy.statusInvalidInput
      );
    } finally {
      setPendingLabel(null);
    }
  }

  async function runReceipt(issue: boolean) {
    try {
      setPendingLabel(issue ? copy.pendingReceiptIssue : copy.pendingReceiptPreview);
      const payload = {
        year: parseRequiredInt(year, copy.yearLabel, copy.statusNonNegativeInteger),
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
        {
          id: Date.now(),
          label: issue ? copy.logIssueReceipt : copy.logPreviewReceipt,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(
          buildPayrollYearEndFailureMessage({
            status: response.status,
            body,
            locale,
            fallback: copy.statusRequestFailed
          })
        );
        return;
      }
      setReceipt(body);
      setStatusMessage(
        body.receipt.issued
          ? `${copy.statusIssuedPrefix} ${body.receipt.receiptNumber}`
          : `${copy.statusPreviewedPrefix} ${body.receipt.receiptNumber}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? normalizePayrollYearEndRuntimeMessage(error.message, locale, copy.statusInvalidInput)
          : copy.statusInvalidInput
      );
    } finally {
      setPendingLabel(null);
    }
  }

  async function runLoadInsuranceReconciliationReport() {
    try {
      setPendingLabel(copy.pendingInsuranceReconciliation);
      const requestYear = parseRequiredInt(year, copy.yearLabel, copy.statusNonNegativeInteger);
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
        {
          id: Date.now(),
          label: copy.logInsuranceReconciliation,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);
      if (!response.ok || "error" in body) {
        setStatusMessage(
          buildPayrollYearEndFailureMessage({
            status: response.status,
            body,
            locale,
            fallback: copy.statusRequestFailed
          })
        );
        return;
      }
      const reconciliationStatusLabel = resolvePayrollYearEndReconciliationStatusLabel(
        body.report.reconciliation.status,
        locale
      );
      setInsuranceReconciliationReport(body);
      setStatusMessage(
        `${copy.statusLoadedInsuranceReconciliationPrefix} (${reconciliationStatusLabel}, ${copy.statusDeltaLabel} ${formatKrw(body.report.reconciliation.deltaKrw, runtimeLocale)})`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? normalizePayrollYearEndRuntimeMessage(error.message, locale, copy.statusInvalidInput)
          : copy.statusInvalidInput
      );
    } finally {
      setPendingLabel(null);
    }
  }

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
          {showDevTools ? (
            <p className="small muted">
              {locale === "ko" ? "세션 조직" : "Session organization"}: <code>{organizationId || "-"}</code> /{" "}
              {locale === "ko" ? "세션 액터" : "Session actor"}: <code>{adminActorId || "-"}</code>
            </p>
          ) : null}
          <div className="input-grid">
            <label>{copy.yearLabel}<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>{copy.employeeIdLabel}<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>{copy.nonTaxableAnnualIncomeLabel}<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
            <label>{copy.earnedIncomeTaxCreditLabel}<input value={earnedIncomeTaxCreditKrw} onChange={(event) => setEarnedIncomeTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.childTaxCreditLabel}<input value={childTaxCreditKrw} onChange={(event) => setChildTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.additionalTaxCreditLabel}<input value={additionalTaxCreditKrw} onChange={(event) => setAdditionalTaxCreditKrw(event.target.value)} /></label>
            <label>{copy.annualIncomeTaxRateLabel}<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>{copy.localIncomeTaxRateLabel}<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
            <label>{copy.issuerNameLabel}<input value={issuerName} onChange={(event) => setIssuerName(event.target.value)} /></label>
            <label>{copy.personalPensionLabel}<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>{copy.insurancePremiumLabel}<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>{copy.medicalExpenseLabel}<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>{copy.educationExpenseLabel}<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>{copy.donationLabel}<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>{copy.housingSavingsLabel}<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label className="checkbox"><input type="checkbox" checked={personalPensionEligible} onChange={(event) => setPersonalPensionEligible(event.target.checked)} />{copy.personalPensionEligibleLabel}</label>
            <label className="checkbox"><input type="checkbox" checked={insurancePremiumEligible} onChange={(event) => setInsurancePremiumEligible(event.target.checked)} />{copy.insurancePremiumEligibleLabel}</label>
            <label className="checkbox"><input type="checkbox" checked={medicalExpenseEligible} onChange={(event) => setMedicalExpenseEligible(event.target.checked)} />{copy.medicalExpenseEligibleLabel}</label>
            <label className="checkbox"><input type="checkbox" checked={educationExpenseEligible} onChange={(event) => setEducationExpenseEligible(event.target.checked)} />{copy.educationExpenseEligibleLabel}</label>
            <label className="checkbox"><input type="checkbox" checked={donationEligible} onChange={(event) => setDonationEligible(event.target.checked)} />{copy.donationEligibleLabel}</label>
            <label className="checkbox"><input type="checkbox" checked={housingSavingsEligible} onChange={(event) => setHousingSavingsEligible(event.target.checked)} />{copy.housingSavingsEligibleLabel}</label>
          </div>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runSettlementPreview()} disabled={pendingLabel !== null}>{copy.previewSettlementAction}</button>
            <button className="btn btn-secondary" onClick={() => void runSettlementRecalculation()} disabled={pendingLabel !== null}>{copy.recalculateSettlementAction}</button>
            <button className="btn btn-secondary" onClick={() => void runLoadInsuranceReconciliationReport()} disabled={pendingLabel !== null}>{copy.loadInsuranceReconciliationAction}</button>
            <button className="btn btn-secondary" onClick={() => void runReceipt(false)} disabled={pendingLabel !== null}>{copy.previewReceiptAction}</button>
            <button className="btn btn-primary" onClick={() => void runReceipt(true)} disabled={pendingLabel !== null}>{copy.issueReceiptAction}</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {normalizedSupabaseSessionError ? (
            <p className="small fail">
              {copy.sessionErrorPrefix}: {normalizedSupabaseSessionError}
            </p>
          ) : null}
        </article>
        <article className="panel">
          <h2>{copy.settlementTitle}</h2>
          {!settlement ? <p className="small">{copy.noSettlementYet}</p> : (
            <ul className="simple-list">
              <li><span>{copy.grossNetLabel}</span><strong>{formatKrw(settlement.summary.annualTotalsKrw.grossPayKrw, runtimeLocale)} / {formatKrw(settlement.summary.annualTotalsKrw.netPayKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.taxCreditInputAppliedLabel}</span><strong>{formatKrw(settlement.summary.settlementKrw.totalTaxCreditInputKrw, runtimeLocale)}{" / "}{formatKrw(settlement.summary.settlementKrw.totalTaxCreditAppliedKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.cappedTaxCreditsLabel}</span><strong>{summarizeCappedTaxCreditItems(settlement.summary.settlementKrw.taxCreditAppliedByItemKrw, copy.taxCreditItemLabels, runtimeLocale, copy.capLabel, locale)}</strong></li>
              <li><span>{copy.taxCreditReasonCodesLabel}</span><strong>{summarizeTaxCreditReasonCodes(settlement.summary.settlementKrw.taxCreditAppliedByItemKrw, copy.taxCreditItemLabels, locale)}</strong></li>
              <li><span>{copy.taxLiabilityLabel}</span><strong>{formatKrw(settlement.summary.settlementKrw.annualTaxLiabilityKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.priorWithheldLabel}</span><strong>{formatKrw(settlement.summary.settlementKrw.priorWithheldTaxKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.withholdingDeltaLabel}</span><strong>{formatKrw(settlement.summary.settlementKrw.withholdingDeltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.additionalWithholdingDueLabel}</span><strong>{formatKrw(settlement.summary.settlementKrw.additionalWithholdingDueKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.withholdingRefundLabel}</span><strong>{formatKrw(settlement.summary.settlementKrw.withholdingRefundKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.previewedRunsLabel}</span><strong>{settlement.summary.runStates.previewedRunIds.join(", ") || "-"}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>{copy.recalculationTitle}</h2>
          {!recalculation ? <p className="small">{copy.noRecalculationYet}</p> : (
            <ul className="simple-list">
              <li><span>{copy.incomeDeductionInputLabel}</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.totalIncomeDeductionKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.cappedDeductionLabel}</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.cappedIncomeDeductionKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.appliedDeductionLabel}</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.appliedIncomeDeductionKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.taxCreditInputAppliedLabel}</span><strong>{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.totalTaxCreditInputKrw, runtimeLocale)}{" / "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.totalTaxCreditAppliedKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.cappedTaxCreditsLabel}</span><strong>{summarizeCappedTaxCreditItems(recalculation.recalculation.recalculatedSettlementKrw.taxCreditAppliedByItemKrw, copy.taxCreditItemLabels, runtimeLocale, copy.capLabel, locale)}</strong></li>
              <li><span>{copy.taxCreditReasonCodesLabel}</span><strong>{summarizeTaxCreditReasonCodes(recalculation.recalculation.recalculatedSettlementKrw.taxCreditAppliedByItemKrw, copy.taxCreditItemLabels, locale)}</strong></li>
              <li><span>{copy.taxableIncomeLabel}</span><strong>{formatKrw(recalculation.recalculation.deductionItemsKrw.taxableAnnualIncomeBeforeDeductionKrw, runtimeLocale)}{" -> "}{formatKrw(recalculation.recalculation.deductionItemsKrw.taxableAnnualIncomeAfterDeductionKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.cappedItemsLabel}</span><strong>{summarizeCappedDeductionItems(recalculation.recalculation.deductionItemsKrw.capAppliedByItemKrw, copy.deductionItemLabels, runtimeLocale, copy.capLabel, locale)}</strong></li>
              <li><span>{copy.deductionReasonCodesLabel}</span><strong>{summarizeDeductionReasonCodes(recalculation.recalculation.deductionItemsKrw.capAppliedByItemKrw, copy.deductionItemLabels, locale)}</strong></li>
              <li><span>{copy.deductionEligibilityLabel}</span><strong>{Object.entries(recalculation.recalculation.deductionEligibility).filter(([, value]) => value).map(([key]) => copy.deductionEligibilityLabels[key] ?? key).join(", ") || "-"}</strong></li>
              <li><span>{copy.eligibilityBlockingReasonsLabel}</span><strong>{resolvePayrollYearEndBlockingReasons(recalculation.recalculation.deductionEligibilityBlockingReasons, locale).join(" | ") || "-"}</strong></li>
              <li><span>{copy.taxLiabilityLabel}</span><strong>{formatKrw(recalculation.recalculation.baselineSettlementKrw.annualTaxLiabilityKrw, runtimeLocale)}{" -> "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.annualTaxLiabilityKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.taxLiabilityDeltaLabel}</span><strong>{formatKrw(recalculation.recalculation.deltaKrw.annualTaxLiabilityDeltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.withholdingDeltaChangeLabel}</span><strong>{formatKrw(recalculation.recalculation.deltaKrw.withholdingDeltaChangeKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.additionalDueLabel}</span><strong>{formatKrw(recalculation.recalculation.baselineSettlementKrw.additionalWithholdingDueKrw, runtimeLocale)}{" -> "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.additionalWithholdingDueKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.refundLabel}</span><strong>{formatKrw(recalculation.recalculation.baselineSettlementKrw.withholdingRefundKrw, runtimeLocale)}{" -> "}{formatKrw(recalculation.recalculation.recalculatedSettlementKrw.withholdingRefundKrw, runtimeLocale)}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>{copy.insuranceReconciliationTitle}</h2>
          {!insuranceReconciliationReport ? <p className="small">{copy.noInsuranceReconciliationReportYet}</p> : (
            <ul className="simple-list">
              <li><span>{copy.statusLabel}</span><strong>{resolvePayrollYearEndReconciliationStatusLabel(insuranceReconciliationReport.report.reconciliation.status, locale)}</strong></li>
              <li><span>{copy.annualSocialInsuranceRunsLabel}</span><strong>{formatKrw(insuranceReconciliationReport.report.annualRunSocialInsuranceKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.comparedInsurancePremiumFinalizationLabel}</span><strong>{formatKrw(insuranceReconciliationReport.report.reconciliation.comparedKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.deltaLabel}</span><strong>{formatKrw(insuranceReconciliationReport.report.reconciliation.deltaKrw, runtimeLocale)}</strong></li>
              <li><span>{copy.insuranceReasonCodeLabel}</span><strong>{resolvePayrollYearEndReasonCodeLabel(insuranceReconciliationReport.report.finalization.applicationReasonCode, locale)}</strong></li>
              <li><span>{copy.monthlyBreakdownLabel}</span><strong>{insuranceReconciliationReport.report.monthlyBreakdown.map((row) => `${row.month}:${formatKrw(row.socialInsuranceKrw, runtimeLocale)}`).join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>
        <article className="panel">
          <h2>{copy.withholdingReceiptTitle}</h2>
          {!receipt ? <p className="small">{copy.noReceiptSummaryYet}</p> : (
            <ul className="simple-list">
              <li><span>{copy.receiptNumberLabel}</span><strong>{receipt.receipt.receiptNumber}</strong></li>
              <li><span>{copy.canIssueIssuedLabel}</span><strong>{receipt.receipt.canIssue ? copy.yesLabel : copy.noLabel} / {receipt.receipt.issued ? copy.yesLabel : copy.noLabel}</strong></li>
              <li><span>{copy.issuedAtLabel}</span><strong>{receipt.receipt.issuedAt ? new Date(receipt.receipt.issuedAt).toLocaleString(runtimeLocale) : "-"}</strong></li>
              <li><span>{copy.pendingReceiptRunsLabel}</span><strong>{receipt.receipt.runStates.pendingReceiptRunIds.join(", ") || "-"}</strong></li>
              <li><span>{copy.blockingReasonsLabel}</span><strong>{resolvePayrollYearEndBlockingReasons(receipt.receipt.blockingReasons, locale).join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>
        <PayrollAccuracyEvidencePanel
          locale={locale}
          copy={copy}
          settlement={settlement}
          recalculation={recalculation}
          insuranceReconciliationReport={insuranceReconciliationReport}
        />
        {showDevTools ? (
          <article className="panel">
            <h2>{copy.apiLogsTitle}</h2>
            <p className="small">{copy.apiLogsTotalLabel} {stats.total} / {copy.apiLogsSuccessLabel} {stats.success} / {copy.apiLogsFailLabel} {stats.fail}{pendingLabel ? ` / ${copy.apiLogsRunningLabel} ${pendingLabel}` : ""}</p>
            {logs.length === 0 ? <p className="small">{copy.noApiCallYet}</p> : (
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
              <Link href="/admin/payroll-year-end/preflight" className="btn btn-secondary">{copy.openPreflightChecklistAction}</Link>
              <Link href="/admin" className="btn btn-secondary">{copy.backToAdminAction}</Link>
            </div>
          </article>
        ) : null}
      </section>
    </main>
  );
}
