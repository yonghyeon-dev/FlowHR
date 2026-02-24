"use client";

import { useMemo, useState } from "react";

import { payrollInsuranceCopyByLocale } from "@/components/payroll-insurance/copy";
import {
  PayrollInsuranceComponentsPanel,
  PayrollInsuranceLogsPanel,
  PayrollInsuranceSummaryPanel
} from "@/components/payroll-insurance/PayrollInsuranceSettlementSections";
import { PayrollInsuranceInputPanel } from "@/components/payroll-insurance/PayrollInsuranceSettlementInputPanel";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";
import type { ApiLog, PayrollInsuranceSettlementResponse } from "@/components/payroll-insurance/types";
import {
  defaultMonthRange,
  formatKrw,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-insurance/types";

function parseRequiredInt(value: string, fieldLabel: string, nonNegativeIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} ${nonNegativeIntegerLabel}`);
  }
  return parsed;
}

function parseRequiredPositiveInt(value: string, fieldLabel: string, positiveIntegerLabel: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${fieldLabel} ${positiveIntegerLabel}`);
  }
  return parsed;
}

function parseOptionalInt(value: string, optionalCapIntegerLabel: string) {
  const normalized = value.trim();
  if (!normalized) {
    return undefined;
  }
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(optionalCapIntegerLabel);
  }
  return parsed;
}

export default function PayrollInsuranceSettlementConsole() {
  const range = defaultMonthRange();
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [accessToken, setAccessToken] = useState("");
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [periodStartDate, setPeriodStartDate] = useState(range.periodStartDate);
  const [periodEndDate, setPeriodEndDate] = useState(range.periodEndDate);
  const [hourlyRateKrw, setHourlyRateKrw] = useState("12000");
  const [nonTaxableIncomeKrw, setNonTaxableIncomeKrw] = useState("0");
  const [priorWithheldKrw, setPriorWithheldKrw] = useState("0");
  const [priorEmployerPaidKrw, setPriorEmployerPaidKrw] = useState("0");
  const [nationalPensionCapKrw, setNationalPensionCapKrw] = useState("");
  const [healthInsuranceCapKrw, setHealthInsuranceCapKrw] = useState("");
  const [employmentInsuranceCapKrw, setEmploymentInsuranceCapKrw] = useState("");
  const [insuranceRoundingMode, setInsuranceRoundingMode] = useState<"round" | "floor" | "ceil">("round");
  const [nationalPensionUnitKrw, setNationalPensionUnitKrw] = useState("1");
  const [healthInsuranceUnitKrw, setHealthInsuranceUnitKrw] = useState("1");
  const [longTermCareUnitKrw, setLongTermCareUnitKrw] = useState("1");
  const [employmentInsuranceUnitKrw, setEmploymentInsuranceUnitKrw] = useState("1");
  const [industrialAccidentUnitKrw, setIndustrialAccidentUnitKrw] = useState("1");
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [result, setResult] = useState<PayrollInsuranceSettlementResponse | null>(null);
  const [logs, setLogs] = useState<ApiLog[]>([]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollInsuranceCopyByLocale[locale];

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

  async function runPreview() {
    if (!employeeId.trim()) {
      setStatusMessage(copy.statusEmployeeRequired);
      return;
    }

    try {
      const payload = {
        employeeId: employeeId.trim(),
        periodStart: toSeoulStartIso(periodStartDate),
        periodEnd: toSeoulEndIso(periodEndDate),
        hourlyRateKrw: parseRequiredInt(hourlyRateKrw, copy.hourlyRateLabel, copy.statusNonNegativeInteger),
        multipliers: {
          regular: 1,
          overtime: 1.5,
          night: 1.5,
          holiday: 2
        },
        settlement: {
          nonTaxableIncomeKrw: parseRequiredInt(
            nonTaxableIncomeKrw,
            copy.nonTaxableIncomeLabel,
            copy.statusNonNegativeInteger
          ),
          requireMonthlyBoundary: true,
          insuranceRounding: {
            mode: insuranceRoundingMode,
            nationalPensionUnitKrw: parseRequiredPositiveInt(
              nationalPensionUnitKrw,
              copy.nationalPensionUnitLabel,
              copy.statusPositiveInteger
            ),
            healthInsuranceUnitKrw: parseRequiredPositiveInt(
              healthInsuranceUnitKrw,
              copy.healthInsuranceUnitLabel,
              copy.statusPositiveInteger
            ),
            longTermCareUnitKrw: parseRequiredPositiveInt(
              longTermCareUnitKrw,
              copy.longTermCareUnitLabel,
              copy.statusPositiveInteger
            ),
            employmentInsuranceUnitKrw: parseRequiredPositiveInt(
              employmentInsuranceUnitKrw,
              copy.employmentInsuranceUnitLabel,
              copy.statusPositiveInteger
            ),
            industrialAccidentUnitKrw: parseRequiredPositiveInt(
              industrialAccidentUnitKrw,
              copy.industrialAccidentUnitLabel,
              copy.statusPositiveInteger
            )
          },
          nationalPensionCapKrw: parseOptionalInt(nationalPensionCapKrw, copy.statusOptionalCapInteger),
          healthInsuranceCapKrw: parseOptionalInt(healthInsuranceCapKrw, copy.statusOptionalCapInteger),
          employmentInsuranceCapKrw: parseOptionalInt(employmentInsuranceCapKrw, copy.statusOptionalCapInteger),
          priorWithheldKrw: parseRequiredInt(
            priorWithheldKrw,
            copy.priorWithheldLabel,
            copy.statusNonNegativeInteger
          ),
          priorEmployerPaidKrw: parseRequiredInt(
            priorEmployerPaidKrw,
            copy.priorEmployerPaidLabel,
            copy.statusNonNegativeInteger
          )
        }
      };

      setPendingLabel(copy.pendingPreview);
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

      const response = await fetch("/api/payroll/runs/preview-insurance-settlement", {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      let body: unknown = null;
      if (text.trim()) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      setLogs((prev) => [
        {
          id: Date.now(),
          label: copy.logPreview,
          status: response.status,
          ok: response.ok,
          at: new Date().toLocaleString(runtimeLocale)
        },
        ...prev
      ]);

      if (!response.ok || !body || typeof body !== "object") {
        setStatusMessage(copy.statusRequestFailed);
        return;
      }

      const parsed = body as PayrollInsuranceSettlementResponse;
      setResult(parsed);
      setStatusMessage(
        `${copy.statusLoadedPrefix} ${formatKrw(parsed.summary.grossPayKrw, runtimeLocale)}, ${copy.statusTotalDeltaLabel} ${formatKrw(parsed.summary.settlementKrw.totalDeltaKrw, runtimeLocale)}`
      );
      setTimeout(() => setStatusMessage(""), 3000);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : copy.statusInvalidInput);
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
        <PayrollInsuranceInputPanel
          copy={copy}
          employeeId={employeeId}
          setEmployeeId={setEmployeeId}
          periodStartDate={periodStartDate}
          setPeriodStartDate={setPeriodStartDate}
          periodEndDate={periodEndDate}
          setPeriodEndDate={setPeriodEndDate}
          hourlyRateKrw={hourlyRateKrw}
          setHourlyRateKrw={setHourlyRateKrw}
          nonTaxableIncomeKrw={nonTaxableIncomeKrw}
          setNonTaxableIncomeKrw={setNonTaxableIncomeKrw}
          priorWithheldKrw={priorWithheldKrw}
          setPriorWithheldKrw={setPriorWithheldKrw}
          priorEmployerPaidKrw={priorEmployerPaidKrw}
          setPriorEmployerPaidKrw={setPriorEmployerPaidKrw}
          nationalPensionCapKrw={nationalPensionCapKrw}
          setNationalPensionCapKrw={setNationalPensionCapKrw}
          healthInsuranceCapKrw={healthInsuranceCapKrw}
          setHealthInsuranceCapKrw={setHealthInsuranceCapKrw}
          employmentInsuranceCapKrw={employmentInsuranceCapKrw}
          setEmploymentInsuranceCapKrw={setEmploymentInsuranceCapKrw}
          insuranceRoundingMode={insuranceRoundingMode}
          setInsuranceRoundingMode={setInsuranceRoundingMode}
          nationalPensionUnitKrw={nationalPensionUnitKrw}
          setNationalPensionUnitKrw={setNationalPensionUnitKrw}
          healthInsuranceUnitKrw={healthInsuranceUnitKrw}
          setHealthInsuranceUnitKrw={setHealthInsuranceUnitKrw}
          longTermCareUnitKrw={longTermCareUnitKrw}
          setLongTermCareUnitKrw={setLongTermCareUnitKrw}
          employmentInsuranceUnitKrw={employmentInsuranceUnitKrw}
          setEmploymentInsuranceUnitKrw={setEmploymentInsuranceUnitKrw}
          industrialAccidentUnitKrw={industrialAccidentUnitKrw}
          setIndustrialAccidentUnitKrw={setIndustrialAccidentUnitKrw}
          accessToken={accessToken}
          setAccessToken={setAccessToken}
          adminActorId={adminActorId}
          setAdminActorId={setAdminActorId}
          organizationId={organizationId}
          setOrganizationId={setOrganizationId}
          pendingLabel={pendingLabel}
          runPreview={() => void runPreview()}
          statusMessage={statusMessage}
          supabaseSessionError={supabaseSessionError}
        />

        <PayrollInsuranceSummaryPanel copy={copy} result={result} runtimeLocale={runtimeLocale} />
        <PayrollInsuranceComponentsPanel copy={copy} result={result} runtimeLocale={runtimeLocale} />
        <PayrollInsuranceLogsPanel copy={copy} stats={stats} pendingLabel={pendingLabel} logs={logs} />
      </section>
    </main>
  );
}
