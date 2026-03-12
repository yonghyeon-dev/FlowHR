"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { isAdminPayrollSource, withAdminSource } from "@/app/admin/source-context";
import { PayrollInsuranceInputPanel } from "@/components/payroll-insurance/PayrollInsuranceSettlementInputPanel";
import {
  PayrollInsuranceComponentsPanel,
  PayrollInsuranceLogsPanel,
  PayrollInsuranceSummaryPanel
} from "@/components/payroll-insurance/PayrollInsuranceSettlementSections";
import { payrollInsuranceCopyByLocale } from "@/components/payroll-insurance/copy";
import type { ApiLog, PayrollInsuranceSettlementResponse } from "@/components/payroll-insurance/types";
import {
  defaultMonthRange,
  formatKrw,
  toSeoulDateTimeIso,
  toSeoulEndIso,
  toSeoulStartIso
} from "@/components/payroll-insurance/types";
import { normalizePayrollYearEndRuntimeMessage } from "@/components/payroll-year-end/runtime-copy-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

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

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function PayrollInsuranceSettlementConsole() {
  const searchParams = useSearchParams();
  const range = defaultMonthRange();
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
  const [insurancePolicyMode, setInsurancePolicyMode] = useState<
    "manual" | "preset_manual" | "preset_auto"
  >("manual");
  const [insurancePolicyPresetId, setInsurancePolicyPresetId] = useState("kr_insurance_policy_v2026_07");
  const [insurancePolicyAsOf, setInsurancePolicyAsOf] = useState("");
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
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();
  const { locale } = useI18n();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = payrollInsuranceCopyByLocale[locale];
  const source = searchParams.get("source");
  const showPayrollSource = isAdminPayrollSource(source);
  const organizationId = (supabaseSession?.organizationId ?? "").trim();
  const adminActorId = (supabaseSession?.actorId ?? "PAY-1001").trim() || "PAY-1001";
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
      copy.statusRequestFailed
    );
  }, [copy.statusRequestFailed, locale, supabaseSessionError]);
  const summaryStatusLabel = result
    ? formatKrw(result.summary.settlementKrw.totalDeltaKrw, runtimeLocale)
    : pendingLabel ?? copy.noResultYet;

  async function runPreview() {
    if (!organizationId.trim()) {
      setStatusMessage(
        locale === "ko"
          ? "세션 조직 정보가 없어 정산 미리보기를 실행할 수 없습니다."
          : "Missing session organization context; cannot preview."
      );
      return;
    }
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
          insurancePolicyPresetAuto: insurancePolicyMode === "preset_auto",
          insurancePolicyPresetId:
            insurancePolicyMode === "preset_manual" && insurancePolicyPresetId.trim().length > 0
              ? insurancePolicyPresetId.trim()
              : undefined,
          insurancePolicyAsOf:
            insurancePolicyMode === "preset_auto" ? toSeoulDateTimeIso(insurancePolicyAsOf) : undefined,
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
          nationalPensionCapKrw: parseOptionalInt(
            nationalPensionCapKrw,
            copy.statusOptionalCapInteger
          ),
          healthInsuranceCapKrw: parseOptionalInt(
            healthInsuranceCapKrw,
            copy.statusOptionalCapInteger
          ),
          employmentInsuranceCapKrw: parseOptionalInt(
            employmentInsuranceCapKrw,
            copy.statusOptionalCapInteger
          ),
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
        `${copy.statusLoadedPrefix} ${formatKrw(parsed.summary.grossPayKrw, runtimeLocale)}, ${
          copy.statusTotalDeltaLabel
        } ${formatKrw(parsed.summary.settlementKrw.totalDeltaKrw, runtimeLocale)}`
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
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <p className="eyebrow">{copy.heroEyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <p className="small muted workspace-source-banner" hidden={showPayrollSource}>
          {locale === "ko"
            ? "급여 마감 전에 보험 기여금과 차액을 먼저 점검하는 운영 작업 화면입니다."
            : "Review insurance contributions and settlement deltas before payroll close."}
        </p>
        {showPayrollSource ? (
          <p className="small muted workspace-source-banner">
            {locale === "ko"
              ? "급여 레인에서 이동했습니다 · 집중 레인: 보험 정산"
              : "Opened from payroll lane · Focused lane: insurance settlement"}
          </p>
        ) : null}
        <div className="page-actions" style={{ marginTop: 8 }}>
          {showPayrollSource ? (
            <Link href="/admin/payroll" className="btn btn-secondary btn-small">
              {locale === "ko" ? "급여 레인으로" : "Back to payroll lane"}
            </Link>
          ) : null}
          <Link href="/admin" className="btn btn-secondary btn-small">
            {copy.backToAdmin}
          </Link>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.title}>
        <article className="kpi">
          <span>{copy.employeeIdLabel}</span>
          <strong>{employeeId.trim() || "-"}</strong>
        </article>
        <article className="kpi">
          <span>{copy.periodStartLabel}</span>
          <strong>
            {periodStartDate} ~ {periodEndDate}
          </strong>
        </article>
        <article className="kpi">
          <span>{copy.apiLogsTotalLabel}</span>
          <strong>
            {stats.total} / {copy.apiLogsSuccessLabel} {stats.success}
          </strong>
        </article>
        <article className="kpi">
          <span>{copy.totalDeltaLabel}</span>
          <strong>{summaryStatusLabel}</strong>
        </article>
      </section>

      <section className="panel-grid workspace-panel-grid">
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
          insurancePolicyMode={insurancePolicyMode}
          setInsurancePolicyMode={setInsurancePolicyMode}
          insurancePolicyPresetId={insurancePolicyPresetId}
          setInsurancePolicyPresetId={setInsurancePolicyPresetId}
          insurancePolicyAsOf={insurancePolicyAsOf}
          setInsurancePolicyAsOf={setInsurancePolicyAsOf}
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
          sessionOrganizationId={organizationId}
          sessionAdminActorId={adminActorId}
          showDevTools={showDevTools}
          locale={locale}
          canRunPreview={organizationId.trim().length > 0}
          pendingLabel={pendingLabel}
          runPreview={() => void runPreview()}
          statusMessage={statusMessage}
          supabaseSessionError={normalizedSupabaseSessionError}
        />

        <PayrollInsuranceSummaryPanel copy={copy} result={result} runtimeLocale={runtimeLocale} />
        <PayrollInsuranceComponentsPanel copy={copy} result={result} runtimeLocale={runtimeLocale} />
        {showDevTools ? (
          <PayrollInsuranceLogsPanel
            copy={copy}
            stats={stats}
            pendingLabel={pendingLabel}
            logs={logs}
          />
        ) : (
          <article className="panel workspace-section-card workspace-note-card">
            <h2>{locale === "ko" ? "워크스페이스 이동" : "Workspace shortcuts"}</h2>
            <div className="panel-actions">
              {showPayrollSource ? (
                <Link href="/admin/payroll" className="btn btn-secondary">
                  {locale === "ko" ? "급여 레인으로" : "Back to payroll lane"}
                </Link>
              ) : null}
              <Link href="/admin" className="btn btn-secondary">
                {copy.backToAdmin}
              </Link>
              {showPayrollSource ? (
                <Link
                  href={withAdminSource("/admin/payroll-close", "admin-payroll")}
                  className="btn btn-secondary"
                >
                  {locale === "ko" ? "급여 마감으로" : "Open payroll close"}
                </Link>
              ) : null}
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
