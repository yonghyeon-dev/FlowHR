"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

type PayPeriod = "MONTHLY" | "BIWEEKLY";

type AdminSettingsDto = {
  fiscalYearStartMonth: number;
  standardWorkHoursPerDay: number;
  standardWorkDaysPerWeek: number;
  overtimeThresholdHours: number;
  payPeriod: PayPeriod;
  timezone: string | null;
  currency: string;
};

type SettingsFormState = {
  fiscalYearStartMonth: string;
  standardWorkHoursPerDay: string;
  standardWorkDaysPerWeek: string;
  overtimeThresholdHours: string;
  payPeriod: PayPeriod;
  timezone: string;
  currency: string;
};

type AdminSettingsCopy = {
  pageTitle: string;
  pageSubtitle: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  formSectionTitle: string;
  formSectionDescription: string;
  guideSectionTitle: string;
  timezonePlaceholder: string;
  currencyPlaceholder: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  timezoneRequired: string;
  currencyInvalid: string;
  apiLoadLabel: string;
  apiSaveLabel: string;
  invalidFieldValue: (fieldName: string) => string;
  fields: {
    fiscalYearStartMonth: string;
    standardWorkHoursPerDay: string;
    standardWorkDaysPerWeek: string;
    overtimeThresholdHours: string;
    payPeriod: string;
    timezone: string;
    currency: string;
  };
  payPeriodOptions: {
    monthly: string;
    biweekly: string;
  };
  guideItems: string[];
};

const defaultFormState: SettingsFormState = {
  fiscalYearStartMonth: "1",
  standardWorkHoursPerDay: "8",
  standardWorkDaysPerWeek: "5",
  overtimeThresholdHours: "8",
  payPeriod: "MONTHLY",
  timezone: "Asia/Seoul",
  currency: "KRW"
};

function getAdminSettingsCopy(locale: string): AdminSettingsCopy {
  if (locale === "ko") {
    return {
      pageTitle: "조직 설정 관리자",
      pageSubtitle: "회계, 근무, 급여 기준값을 조회하고 저장합니다.",
      reloadLabel: "다시 불러오기",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장 중...",
      formSectionTitle: "설정 입력",
      formSectionDescription: "아래 항목은 GET/PATCH /api/admin/settings 와 연동됩니다.",
      guideSectionTitle: "입력 가이드",
      timezonePlaceholder: "예: Asia/Seoul",
      currencyPlaceholder: "예: KRW",
      loadFailed: "조직 설정을 불러오지 못했습니다.",
      saveFailed: "조직 설정 저장에 실패했습니다.",
      saveSuccess: "조직 설정이 저장되었습니다.",
      timezoneRequired: "타임존을 입력해 주세요.",
      currencyInvalid: "통화 코드는 3자리 영문 코드여야 합니다. (예: KRW)",
      apiLoadLabel: "조직 설정 조회",
      apiSaveLabel: "조직 설정 저장",
      invalidFieldValue: (fieldName) => `${fieldName} 값을 확인해 주세요.`,
      fields: {
        fiscalYearStartMonth: "회계연도 시작월",
        standardWorkHoursPerDay: "일일 근무시간(시간)",
        standardWorkDaysPerWeek: "주간 근무일수(일)",
        overtimeThresholdHours: "초과근무 기준(시간)",
        payPeriod: "급여 주기",
        timezone: "타임존",
        currency: "통화 코드"
      },
      payPeriodOptions: {
        monthly: "월간 (MONTHLY)",
        biweekly: "격주 (BIWEEKLY)"
      },
      guideItems: [
        "회계연도 시작월: 1~12 정수",
        "일일 근무시간(시간): 1~24",
        "주간 근무일수(일): 1~7 정수",
        "초과근무 기준(시간): 0~168",
        "급여 주기: 월간 또는 격주",
        "타임존: 예) Asia/Seoul, Asia/Tokyo",
        "통화: 3자리 코드 (예: KRW, USD)"
      ]
    };
  }

  return {
    pageTitle: "Organization Settings Admin",
    pageSubtitle: "Review and update accounting, work, and payroll defaults.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save Settings",
    saveLoadingLabel: "Saving...",
    formSectionTitle: "Settings Input",
    formSectionDescription: "The fields below are connected to GET/PATCH /api/admin/settings.",
    guideSectionTitle: "Input Guide",
    timezonePlaceholder: "e.g. Asia/Seoul",
    currencyPlaceholder: "e.g. KRW",
    loadFailed: "Failed to load organization settings.",
    saveFailed: "Failed to save organization settings.",
    saveSuccess: "Organization settings were saved.",
    timezoneRequired: "Please enter a timezone.",
    currencyInvalid: "Currency code must be a 3-letter alphabetic code. (e.g. KRW)",
    apiLoadLabel: "Load organization settings",
    apiSaveLabel: "Save organization settings",
    invalidFieldValue: (fieldName) => `Please check the value for ${fieldName}.`,
    fields: {
      fiscalYearStartMonth: "Fiscal Year Start Month",
      standardWorkHoursPerDay: "Standard Work Hours Per Day",
      standardWorkDaysPerWeek: "Standard Work Days Per Week",
      overtimeThresholdHours: "Overtime Threshold Hours",
      payPeriod: "Pay Period",
      timezone: "Timezone",
      currency: "Currency Code"
    },
    payPeriodOptions: {
      monthly: "Monthly (MONTHLY)",
      biweekly: "Biweekly (BIWEEKLY)"
    },
    guideItems: [
      "Fiscal year start month: integer from 1 to 12",
      "Standard work hours per day: from 1 to 24",
      "Standard work days per week: integer from 1 to 7",
      "Overtime threshold hours: from 0 to 168",
      "Pay period: Monthly or Biweekly",
      "Timezone: e.g. Asia/Seoul, Asia/Tokyo",
      "Currency: 3-letter code (e.g. KRW, USD)"
    ]
  };
}

function toErrorMessage(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") {
    return fallback;
  }

  const candidate = body as { error?: unknown; message?: unknown };
  if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
    return candidate.error.trim();
  }
  if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
    return candidate.message.trim();
  }
  return fallback;
}

function mapDtoToForm(dto: AdminSettingsDto): SettingsFormState {
  return {
    fiscalYearStartMonth: String(dto.fiscalYearStartMonth),
    standardWorkHoursPerDay: String(dto.standardWorkHoursPerDay),
    standardWorkDaysPerWeek: String(dto.standardWorkDaysPerWeek),
    overtimeThresholdHours: String(dto.overtimeThresholdHours),
    payPeriod: dto.payPeriod,
    timezone: dto.timezone?.trim() || "Asia/Seoul",
    currency: dto.currency.trim().toUpperCase()
  };
}

function parseInteger(value: string, invalidValueErrorMessage: string) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    throw new Error(invalidValueErrorMessage);
  }
  return parsed;
}

function parseNumber(value: string, invalidValueErrorMessage: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(invalidValueErrorMessage);
  }
  return parsed;
}

export default function AdminSettingsPage() {
  const { locale } = useI18n();
  const { loading: supabaseSessionLoading } = useSupabaseSession();
  const runtimeLocale = locale === "ko" ? "ko-KR" : "en-US";
  const copy = useMemo(() => getAdminSettingsCopy(locale), [locale]);
  const [form, setForm] = useState<SettingsFormState>(defaultFormState);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await performAdminApiCall({
        label: copy.apiLoadLabel,
        method: "GET",
        path: "/api/admin/settings",
        runtimeLocale
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, copy.loadFailed));
      }

      const body = result.body as AdminSettingsDto;
      setForm(mapDtoToForm(body));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [copy.apiLoadLabel, copy.loadFailed, runtimeLocale]);

  useEffect(() => {
    if (supabaseSessionLoading) {
      return;
    }
    void loadSettings();
  }, [loadSettings, supabaseSessionLoading]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setError(null);
    setNotice(null);

    try {
      const timezone = form.timezone.trim();
      const currency = form.currency.trim().toUpperCase();

      if (!timezone) {
        throw new Error(copy.timezoneRequired);
      }
      if (!/^[A-Za-z]{3}$/.test(currency)) {
        throw new Error(copy.currencyInvalid);
      }

      const payload = {
        fiscalYearStartMonth: parseInteger(
          form.fiscalYearStartMonth,
          copy.invalidFieldValue(copy.fields.fiscalYearStartMonth)
        ),
        standardWorkHoursPerDay: parseNumber(
          form.standardWorkHoursPerDay,
          copy.invalidFieldValue(copy.fields.standardWorkHoursPerDay)
        ),
        standardWorkDaysPerWeek: parseInteger(
          form.standardWorkDaysPerWeek,
          copy.invalidFieldValue(copy.fields.standardWorkDaysPerWeek)
        ),
        overtimeThresholdHours: parseNumber(
          form.overtimeThresholdHours,
          copy.invalidFieldValue(copy.fields.overtimeThresholdHours)
        ),
        payPeriod: form.payPeriod,
        timezone,
        currency
      };

      const result = await performAdminApiCall({
        label: copy.apiSaveLabel,
        method: "PATCH",
        path: "/api/admin/settings",
        payload,
        runtimeLocale
      });

      if (!result.response.ok) {
        throw new Error(toErrorMessage(result.body, copy.saveFailed));
      }

      const body = result.body as AdminSettingsDto;
      setForm(mapDtoToForm(body));
      setNotice(copy.saveSuccess);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
  }, [copy, form, runtimeLocale]);

  if (supabaseSessionLoading) {
    return null;
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary" type="button" onClick={() => void loadSettings()} disabled={isLoading}>
            {isLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      {error ? <p className="small fail">{error}</p> : null}
      {notice ? <p className="small ok">{notice}</p> : null}

      <section className="panel-grid">
        <article className="panel">
          <h2>{copy.formSectionTitle}</h2>
          <p className="small muted">{copy.formSectionDescription}</p>

          <div className="input-grid">
            <label>
              {copy.fields.fiscalYearStartMonth}
              <input
                type="number"
                min={1}
                max={12}
                value={form.fiscalYearStartMonth}
                onChange={(event) => setForm((prev) => ({ ...prev, fiscalYearStartMonth: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.standardWorkHoursPerDay}
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={form.standardWorkHoursPerDay}
                onChange={(event) => setForm((prev) => ({ ...prev, standardWorkHoursPerDay: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.standardWorkDaysPerWeek}
              <input
                type="number"
                min={1}
                max={7}
                value={form.standardWorkDaysPerWeek}
                onChange={(event) => setForm((prev) => ({ ...prev, standardWorkDaysPerWeek: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.overtimeThresholdHours}
              <input
                type="number"
                min={0}
                max={168}
                step={0.5}
                value={form.overtimeThresholdHours}
                onChange={(event) => setForm((prev) => ({ ...prev, overtimeThresholdHours: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.payPeriod}
              <select
                value={form.payPeriod}
                onChange={(event) => setForm((prev) => ({ ...prev, payPeriod: event.target.value as PayPeriod }))}
              >
                <option value="MONTHLY">{copy.payPeriodOptions.monthly}</option>
                <option value="BIWEEKLY">{copy.payPeriodOptions.biweekly}</option>
              </select>
            </label>

            <label>
              {copy.fields.timezone}
              <input
                type="text"
                placeholder={copy.timezonePlaceholder}
                value={form.timezone}
                onChange={(event) => setForm((prev) => ({ ...prev, timezone: event.target.value }))}
              />
            </label>

            <label>
              {copy.fields.currency}
              <input
                type="text"
                placeholder={copy.currencyPlaceholder}
                maxLength={3}
                value={form.currency}
                onChange={(event) => setForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
              />
            </label>
          </div>

          <div className="panel-actions">
            <button className="btn btn-primary" type="button" onClick={() => void handleSave()} disabled={isSaving}>
              {isSaving ? copy.saveLoadingLabel : copy.saveLabel}
            </button>
          </div>
        </article>

        <article className="panel">
          <h2>{copy.guideSectionTitle}</h2>
          <ul className="simple-list">
            {copy.guideItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </main>
  );
}
