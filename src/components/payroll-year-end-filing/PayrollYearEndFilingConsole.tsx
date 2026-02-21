"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { currentYear, formatKrw } from "@/components/payroll-year-end/types";
import type {
  ApiLog,
  PayrollYearEndFilingExportResponse,
  PayrollYearEndFinalizationResponse
} from "@/components/payroll-year-end-filing/types";

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

export default function PayrollYearEndFilingConsole() {
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [year, setYear] = useState(String(currentYear()));
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [nonTaxableAnnualIncomeKrw, setNonTaxableAnnualIncomeKrw] = useState("0");
  const [additionalTaxCreditKrw, setAdditionalTaxCreditKrw] = useState("0");
  const [annualIncomeTaxRate, setAnnualIncomeTaxRate] = useState("0.03");
  const [localIncomeTaxRate, setLocalIncomeTaxRate] = useState("0.1");
  const [personalPensionKrw, setPersonalPensionKrw] = useState("0");
  const [insurancePremiumKrw, setInsurancePremiumKrw] = useState("0");
  const [medicalExpenseKrw, setMedicalExpenseKrw] = useState("0");
  const [educationExpenseKrw, setEducationExpenseKrw] = useState("0");
  const [donationKrw, setDonationKrw] = useState("0");
  const [housingSavingsKrw, setHousingSavingsKrw] = useState("0");
  const [finalizedByNote, setFinalizedByNote] = useState("year-end baseline finalize");
  const [exportFormat, setExportFormat] = useState<"json" | "csv">("json");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [finalization, setFinalization] = useState<PayrollYearEndFinalizationResponse | null>(null);
  const [filingExport, setFilingExport] = useState<PayrollYearEndFilingExportResponse | null>(null);
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

  function buildFinalizePayload(apply: boolean) {
    return {
      year: parseRequiredInt(year, "year"),
      employeeId: employeeId.trim(),
      nonTaxableAnnualIncomeKrw: parseRequiredInt(
        nonTaxableAnnualIncomeKrw,
        "nonTaxableAnnualIncomeKrw"
      ),
      additionalTaxCreditKrw: parseRequiredInt(additionalTaxCreditKrw, "additionalTaxCreditKrw"),
      annualIncomeTaxRate: parseRate(annualIncomeTaxRate, "annualIncomeTaxRate"),
      localIncomeTaxRate: parseRate(localIncomeTaxRate, "localIncomeTaxRate"),
      deductionItems: {
        personalPensionKrw: parseRequiredInt(personalPensionKrw, "personalPensionKrw"),
        insurancePremiumKrw: parseRequiredInt(insurancePremiumKrw, "insurancePremiumKrw"),
        medicalExpenseKrw: parseRequiredInt(medicalExpenseKrw, "medicalExpenseKrw"),
        educationExpenseKrw: parseRequiredInt(educationExpenseKrw, "educationExpenseKrw"),
        donationKrw: parseRequiredInt(donationKrw, "donationKrw"),
        housingSavingsKrw: parseRequiredInt(housingSavingsKrw, "housingSavingsKrw")
      },
      apply,
      finalizedByNote: finalizedByNote.trim() || undefined
    };
  }

  async function runFinalization(apply: boolean) {
    try {
      setPendingLabel(apply ? "year-end finalization apply" : "year-end finalization preview");
      const response = await fetch("/api/payroll/year-end/finalize-settlement", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(buildFinalizePayload(apply))
      });
      const body = (await response.json()) as PayrollYearEndFinalizationResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: apply ? "finalize settlement" : "preview finalization",
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
      setFinalization(body);
      setStatusMessage(body.settlement.finalized ? `finalized ${body.settlement.finalizationId}` : "preview loaded");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "invalid input");
    } finally {
      setPendingLabel(null);
    }
  }

  async function runFilingExport() {
    try {
      setPendingLabel("year-end filing export");
      const payload = {
        year: parseRequiredInt(year, "year"),
        employeeId: employeeId.trim(),
        format: exportFormat
      };
      const response = await fetch("/api/payroll/year-end/export-filing-data", {
        method: "POST",
        headers: buildHeaders(),
        body: JSON.stringify(payload)
      });
      const body = (await response.json()) as PayrollYearEndFilingExportResponse | { error: string };
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "export filing data",
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
      setFilingExport(body);
      setStatusMessage(`exported ${body.filingData.records.length} records`);
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
        <h1>Payroll Year-End Finalization and Filing Export</h1>
        <p>Finalize year-end settlement after guard checks and export filing-ready annual payroll data.</p>
      </header>

      <section className="panel-grid">
        <article className="panel">
          <h2>Input</h2>
          <div className="input-grid">
            <label>Year<input value={year} onChange={(event) => setYear(event.target.value)} /></label>
            <label>Employee ID<input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} /></label>
            <label>Non-taxable Annual Income<input value={nonTaxableAnnualIncomeKrw} onChange={(event) => setNonTaxableAnnualIncomeKrw(event.target.value)} /></label>
            <label>Additional Tax Credit<input value={additionalTaxCreditKrw} onChange={(event) => setAdditionalTaxCreditKrw(event.target.value)} /></label>
            <label>Annual Income Tax Rate<input value={annualIncomeTaxRate} onChange={(event) => setAnnualIncomeTaxRate(event.target.value)} /></label>
            <label>Local Income Tax Rate<input value={localIncomeTaxRate} onChange={(event) => setLocalIncomeTaxRate(event.target.value)} /></label>
            <label>Personal Pension<input value={personalPensionKrw} onChange={(event) => setPersonalPensionKrw(event.target.value)} /></label>
            <label>Insurance Premium<input value={insurancePremiumKrw} onChange={(event) => setInsurancePremiumKrw(event.target.value)} /></label>
            <label>Medical Expense<input value={medicalExpenseKrw} onChange={(event) => setMedicalExpenseKrw(event.target.value)} /></label>
            <label>Education Expense<input value={educationExpenseKrw} onChange={(event) => setEducationExpenseKrw(event.target.value)} /></label>
            <label>Donation<input value={donationKrw} onChange={(event) => setDonationKrw(event.target.value)} /></label>
            <label>Housing Savings<input value={housingSavingsKrw} onChange={(event) => setHousingSavingsKrw(event.target.value)} /></label>
            <label>Export Format
              <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as "json" | "csv")}>
                <option value="json">json</option>
                <option value="csv">csv</option>
              </select>
            </label>
          </div>
          <label>Finalization Note<input value={finalizedByNote} onChange={(event) => setFinalizedByNote(event.target.value)} /></label>
          <label>Access Token (optional)<input value={accessToken} onChange={(event) => setAccessToken(event.target.value)} placeholder="Bearer token" /></label>
          <label>Actor ID (dev fallback)<input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} /></label>
          <label>Organization ID (dev fallback)<input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} /></label>
          <div className="panel-actions">
            <button className="btn btn-secondary" onClick={() => void runFinalization(false)} disabled={pendingLabel !== null}>Preview Finalization</button>
            <button className="btn btn-primary" onClick={() => void runFinalization(true)} disabled={pendingLabel !== null}>Finalize Settlement</button>
            <button className="btn btn-secondary" onClick={() => void runFilingExport()} disabled={pendingLabel !== null}>Export Filing Data</button>
          </div>
          {statusMessage ? <p className="small">{statusMessage}</p> : null}
          {supabaseSessionError ? <p className="small fail">Session error: {supabaseSessionError}</p> : null}
        </article>

        <article className="panel">
          <h2>Finalization</h2>
          {!finalization ? <p className="small">No finalization summary yet.</p> : (
            <ul className="simple-list">
              <li><span>Can Finalize / Finalized</span><strong>{finalization.settlement.canFinalize ? "YES" : "NO"} / {finalization.settlement.finalized ? "YES" : "NO"}</strong></li>
              <li><span>Finalization ID</span><strong>{finalization.settlement.finalizationId}</strong></li>
              <li><span>Tax Liability</span><strong>{formatKrw(finalization.settlement.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(finalization.settlement.settlementKrw.withholdingDeltaKrw)}</strong></li>
              <li><span>Applied Deduction</span><strong>{formatKrw(finalization.settlement.deductionItemsKrw.appliedIncomeDeductionKrw)}</strong></li>
              <li><span>Blocking Reasons</span><strong>{finalization.settlement.blockingReasons.join(" | ") || "-"}</strong></li>
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Filing Export</h2>
          {!filingExport ? <p className="small">No export yet.</p> : (
            <ul className="simple-list">
              <li><span>Finalization ID</span><strong>{filingExport.filingData.finalizationId}</strong></li>
              <li><span>Format</span><strong>{filingExport.filingData.format}</strong></li>
              <li><span>Exported Records</span><strong>{filingExport.filingData.records.length}</strong></li>
              <li><span>Tax Liability</span><strong>{formatKrw(filingExport.filingData.settlementKrw.annualTaxLiabilityKrw)}</strong></li>
              <li><span>Withholding Delta</span><strong>{formatKrw(filingExport.filingData.settlementKrw.withholdingDeltaKrw)}</strong></li>
              <li><span>CSV</span><strong>{filingExport.filingData.csv ? "ready" : "-"}</strong></li>
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
            <Link href="/admin/payroll-year-end" className="btn btn-secondary">Back to Year-End</Link>
            <Link href="/admin" className="btn btn-secondary">Back to Admin</Link>
          </div>
        </article>
      </section>
    </main>
  );
}
