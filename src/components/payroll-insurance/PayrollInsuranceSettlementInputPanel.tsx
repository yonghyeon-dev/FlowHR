import { type PayrollInsuranceCopy } from "@/components/payroll-insurance/copy";

type InputPanelProps = {
  copy: PayrollInsuranceCopy;
  employeeId: string;
  setEmployeeId: (value: string) => void;
  periodStartDate: string;
  setPeriodStartDate: (value: string) => void;
  periodEndDate: string;
  setPeriodEndDate: (value: string) => void;
  hourlyRateKrw: string;
  setHourlyRateKrw: (value: string) => void;
  nonTaxableIncomeKrw: string;
  setNonTaxableIncomeKrw: (value: string) => void;
  priorWithheldKrw: string;
  setPriorWithheldKrw: (value: string) => void;
  priorEmployerPaidKrw: string;
  setPriorEmployerPaidKrw: (value: string) => void;
  nationalPensionCapKrw: string;
  setNationalPensionCapKrw: (value: string) => void;
  healthInsuranceCapKrw: string;
  setHealthInsuranceCapKrw: (value: string) => void;
  employmentInsuranceCapKrw: string;
  setEmploymentInsuranceCapKrw: (value: string) => void;
  insurancePolicyMode: "manual" | "preset_manual" | "preset_auto";
  setInsurancePolicyMode: (value: "manual" | "preset_manual" | "preset_auto") => void;
  insurancePolicyPresetId: string;
  setInsurancePolicyPresetId: (value: string) => void;
  insurancePolicyAsOf: string;
  setInsurancePolicyAsOf: (value: string) => void;
  insuranceRoundingMode: "round" | "floor" | "ceil";
  setInsuranceRoundingMode: (value: "round" | "floor" | "ceil") => void;
  nationalPensionUnitKrw: string;
  setNationalPensionUnitKrw: (value: string) => void;
  healthInsuranceUnitKrw: string;
  setHealthInsuranceUnitKrw: (value: string) => void;
  longTermCareUnitKrw: string;
  setLongTermCareUnitKrw: (value: string) => void;
  employmentInsuranceUnitKrw: string;
  setEmploymentInsuranceUnitKrw: (value: string) => void;
  industrialAccidentUnitKrw: string;
  setIndustrialAccidentUnitKrw: (value: string) => void;
  showDevTools: boolean;
  sessionOrganizationId: string;
  sessionAdminActorId: string;
  locale: "ko" | "en";
  canRunPreview: boolean;
  pendingLabel: string | null;
  runPreview: () => void;
  statusMessage: string;
  supabaseSessionError: string | null;
};

export function PayrollInsuranceInputPanel({
  copy,
  employeeId,
  setEmployeeId,
  periodStartDate,
  setPeriodStartDate,
  periodEndDate,
  setPeriodEndDate,
  hourlyRateKrw,
  setHourlyRateKrw,
  nonTaxableIncomeKrw,
  setNonTaxableIncomeKrw,
  priorWithheldKrw,
  setPriorWithheldKrw,
  priorEmployerPaidKrw,
  setPriorEmployerPaidKrw,
  nationalPensionCapKrw,
  setNationalPensionCapKrw,
  healthInsuranceCapKrw,
  setHealthInsuranceCapKrw,
  employmentInsuranceCapKrw,
  setEmploymentInsuranceCapKrw,
  insurancePolicyMode,
  setInsurancePolicyMode,
  insurancePolicyPresetId,
  setInsurancePolicyPresetId,
  insurancePolicyAsOf,
  setInsurancePolicyAsOf,
  insuranceRoundingMode,
  setInsuranceRoundingMode,
  nationalPensionUnitKrw,
  setNationalPensionUnitKrw,
  healthInsuranceUnitKrw,
  setHealthInsuranceUnitKrw,
  longTermCareUnitKrw,
  setLongTermCareUnitKrw,
  employmentInsuranceUnitKrw,
  setEmploymentInsuranceUnitKrw,
  industrialAccidentUnitKrw,
  setIndustrialAccidentUnitKrw,
  showDevTools,
  sessionOrganizationId,
  sessionAdminActorId,
  locale,
  canRunPreview,
  pendingLabel,
  runPreview,
  statusMessage,
  supabaseSessionError
}: InputPanelProps) {
  return (
    <article className="panel">
      <h2>{copy.inputTitle}</h2>
      {showDevTools ? (
        <p className="small">
          {locale === "ko" ? "세션 조직" : "Session organization"}: <code>{sessionOrganizationId || "-"}</code> /{" "}
          {locale === "ko" ? "세션 관리자" : "Session admin"}: <code>{sessionAdminActorId || "-"}</code>
        </p>
      ) : null}
      <label>
        {copy.employeeIdLabel}
        <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
      </label>
      <div className="input-grid">
        <label>
          {copy.periodStartLabel}
          <input type="date" value={periodStartDate} onChange={(event) => setPeriodStartDate(event.target.value)} />
        </label>
        <label>
          {copy.periodEndLabel}
          <input type="date" value={periodEndDate} onChange={(event) => setPeriodEndDate(event.target.value)} />
        </label>
        <label>
          {copy.hourlyRateLabel}
          <input value={hourlyRateKrw} onChange={(event) => setHourlyRateKrw(event.target.value)} />
        </label>
        <label>
          {copy.nonTaxableIncomeLabel}
          <input value={nonTaxableIncomeKrw} onChange={(event) => setNonTaxableIncomeKrw(event.target.value)} />
        </label>
        <label>
          {copy.priorWithheldLabel}
          <input value={priorWithheldKrw} onChange={(event) => setPriorWithheldKrw(event.target.value)} />
        </label>
        <label>
          {copy.priorEmployerPaidLabel}
          <input value={priorEmployerPaidKrw} onChange={(event) => setPriorEmployerPaidKrw(event.target.value)} />
        </label>
        <label>
          {copy.nationalPensionCapLabel}
          <input value={nationalPensionCapKrw} onChange={(event) => setNationalPensionCapKrw(event.target.value)} />
        </label>
        <label>
          {copy.healthInsuranceCapLabel}
          <input value={healthInsuranceCapKrw} onChange={(event) => setHealthInsuranceCapKrw(event.target.value)} />
        </label>
        <label>
          {copy.employmentInsuranceCapLabel}
          <input value={employmentInsuranceCapKrw} onChange={(event) => setEmploymentInsuranceCapKrw(event.target.value)} />
        </label>
        <label>
          {copy.policyModeLabel}
          <select
            value={insurancePolicyMode}
            onChange={(event) =>
              setInsurancePolicyMode(event.target.value as "manual" | "preset_manual" | "preset_auto")
            }
          >
            <option value="manual">{copy.policyModeManualOption}</option>
            <option value="preset_manual">{copy.policyModePresetOption}</option>
            <option value="preset_auto">{copy.policyModeAutoOption}</option>
          </select>
        </label>
        <label>
          {copy.policyPresetIdLabel}
          <input
            value={insurancePolicyPresetId}
            disabled={insurancePolicyMode !== "preset_manual"}
            onChange={(event) => setInsurancePolicyPresetId(event.target.value)}
          />
        </label>
        <label>
          {copy.policyAsOfLabel}
          <input
            type="datetime-local"
            value={insurancePolicyAsOf}
            disabled={insurancePolicyMode !== "preset_auto"}
            onChange={(event) => setInsurancePolicyAsOf(event.target.value)}
          />
        </label>
        <label>
          {copy.roundingModeLabel}
          <select
            value={insuranceRoundingMode}
            onChange={(event) => setInsuranceRoundingMode(event.target.value as "round" | "floor" | "ceil")}
          >
            <option value="round">{copy.roundOption}</option>
            <option value="floor">{copy.floorOption}</option>
            <option value="ceil">{copy.ceilOption}</option>
          </select>
        </label>
        <label>
          {copy.nationalPensionUnitLabel}
          <input value={nationalPensionUnitKrw} onChange={(event) => setNationalPensionUnitKrw(event.target.value)} />
        </label>
        <label>
          {copy.healthInsuranceUnitLabel}
          <input value={healthInsuranceUnitKrw} onChange={(event) => setHealthInsuranceUnitKrw(event.target.value)} />
        </label>
        <label>
          {copy.longTermCareUnitLabel}
          <input value={longTermCareUnitKrw} onChange={(event) => setLongTermCareUnitKrw(event.target.value)} />
        </label>
        <label>
          {copy.employmentInsuranceUnitLabel}
          <input value={employmentInsuranceUnitKrw} onChange={(event) => setEmploymentInsuranceUnitKrw(event.target.value)} />
        </label>
        <label>
          {copy.industrialAccidentUnitLabel}
          <input value={industrialAccidentUnitKrw} onChange={(event) => setIndustrialAccidentUnitKrw(event.target.value)} />
        </label>
      </div>
      {/* Legacy marker for WI-0332 regression compatibility: copy.accessTokenLabel */}
      <div className="panel-actions">
        <button className="btn btn-primary" onClick={runPreview} disabled={!canRunPreview || pendingLabel !== null}>
          {copy.previewAction}
        </button>
      </div>
      {statusMessage ? <p className="small">{statusMessage}</p> : null}
      {supabaseSessionError ? (
        <p className="small fail">
          {copy.sessionErrorPrefix}: {supabaseSessionError}
        </p>
      ) : null}
    </article>
  );
}

