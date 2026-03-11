"use client";

import Link from "next/link";
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
  sourceHint: string;
  reloadLabel: string;
  reloadLoadingLabel: string;
  saveLabel: string;
  saveLoadingLabel: string;
  formSectionTitle: string;
  formSectionDescription: string;
  guideSectionTitle: string;
  guideSectionDescription: string;
  summaryLabels: {
    fiscalYearStartMonth: string;
    workRule: string;
    payPeriod: string;
  };
  timezonePlaceholder: string;
  currencyPlaceholder: string;
  loadFailed: string;
  saveFailed: string;
  saveSuccess: string;
  timezoneRequired: string;
  currencyInvalid: string;
  apiLoadLabel: string;
  apiSaveLabel: string;
  navigation: {
    backToHub: string;
    securitySettings: string;
  };
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
      pageSubtitle: "회계, 근무, 급여 기본값을 한 화면에서 점검하고 업데이트합니다.",
      sourceHint: "운영 기본값은 다른 워크스페이스의 계산과 자동화 기준으로 바로 연결됩니다.",
      reloadLabel: "다시 불러오기",
      reloadLoadingLabel: "불러오는 중...",
      saveLabel: "설정 저장",
      saveLoadingLabel: "저장하는 중...",
      formSectionTitle: "운영 기본값 입력",
      formSectionDescription: "아래 입력값은 GET/PATCH /api/admin/settings와 연결되며 저장 즉시 조직 기본값으로 반영됩니다.",
      guideSectionTitle: "입력 가이드",
      guideSectionDescription: "월마감, 연장근로, 급여 계산에 쓰이는 기본값이므로 현재 운영 기준과 맞는지 먼저 확인하세요.",
      summaryLabels: {
        fiscalYearStartMonth: "회계연도 시작",
        workRule: "근무 기본값",
        payPeriod: "급여 주기"
      },
      timezonePlaceholder: "예: Asia/Seoul",
      currencyPlaceholder: "예: KRW",
      loadFailed: "조직 설정을 불러오지 못했습니다.",
      saveFailed: "조직 설정 저장에 실패했습니다.",
      saveSuccess: "조직 설정이 저장되었습니다.",
      timezoneRequired: "시간대를 입력해 주세요.",
      currencyInvalid: "통화 코드는 3자리 영문 코드여야 합니다. 예: KRW",
      apiLoadLabel: "조직 설정 조회",
      apiSaveLabel: "조직 설정 저장",
      navigation: {
        backToHub: "관리자 허브",
        securitySettings: "출퇴근 보안 설정"
      },
      invalidFieldValue: (fieldName) => `${fieldName} 값을 확인해 주세요.`,
      fields: {
        fiscalYearStartMonth: "회계연도 시작 월",
        standardWorkHoursPerDay: "일일 기준 근무시간",
        standardWorkDaysPerWeek: "주간 기준 근무일수",
        overtimeThresholdHours: "연장근로 기준 시간",
        payPeriod: "급여 주기",
        timezone: "시간대",
        currency: "통화 코드"
      },
      payPeriodOptions: {
        monthly: "월 단위 정산",
        biweekly: "격주 정산"
      },
      guideItems: [
        "회계연도 시작 월은 1~12 사이의 정수만 허용됩니다.",
        "일일 기준 근무시간은 1~24시간 범위에서 입력합니다.",
        "주간 기준 근무일수는 1~7일 범위에서 입력합니다.",
        "연장근로 기준 시간은 0~168시간 범위에서 입력합니다.",
        "시간대는 실제 운영 지역과 동일하게 유지해야 근태와 급여 산출이 어긋나지 않습니다.",
        "통화 코드는 KRW, USD처럼 3자리 영문 코드로 입력합니다."
      ]
    };
  }

  return {
    pageTitle: "Organization Settings Admin",
    pageSubtitle: "Review and update accounting, work, and payroll defaults in one place.",
    sourceHint: "These defaults feed downstream payroll, attendance, and automation workspaces.",
    reloadLabel: "Reload",
    reloadLoadingLabel: "Loading...",
    saveLabel: "Save settings",
    saveLoadingLabel: "Saving...",
    formSectionTitle: "Operating defaults",
    formSectionDescription: "The fields below are wired to GET/PATCH /api/admin/settings and become the organization baseline immediately after save.",
    guideSectionTitle: "Input guide",
    guideSectionDescription: "Confirm the live operating baseline before changing values used by payroll and overtime calculations.",
    summaryLabels: {
      fiscalYearStartMonth: "Fiscal year start",
      workRule: "Work rule baseline",
      payPeriod: "Pay cycle"
    },
    timezonePlaceholder: "e.g. Asia/Seoul",
    currencyPlaceholder: "e.g. KRW",
    loadFailed: "Failed to load organization settings.",
    saveFailed: "Failed to save organization settings.",
    saveSuccess: "Organization settings were saved.",
    timezoneRequired: "Please enter a timezone.",
    currencyInvalid: "Currency code must be a 3-letter alphabetic code. Example: KRW",
    apiLoadLabel: "Load organization settings",
    apiSaveLabel: "Save organization settings",
    navigation: {
      backToHub: "Admin hub",
      securitySettings: "Attendance security"
    },
    invalidFieldValue: (fieldName) => `Please check the value for ${fieldName}.`,
    fields: {
      fiscalYearStartMonth: "Fiscal year start month",
      standardWorkHoursPerDay: "Standard work hours per day",
      standardWorkDaysPerWeek: "Standard work days per week",
      overtimeThresholdHours: "Overtime threshold hours",
      payPeriod: "Pay period",
      timezone: "Timezone",
      currency: "Currency code"
    },
    payPeriodOptions: {
      monthly: "Monthly",
      biweekly: "Biweekly"
    },
    guideItems: [
      "Fiscal year start month must be an integer from 1 to 12.",
      "Standard work hours per day must stay between 1 and 24.",
      "Standard work days per week must stay between 1 and 7.",
      "Overtime threshold hours must stay between 0 and 168.",
      "Timezone should match the organization’s live operating region.",
      "Currency codes must use a 3-letter alphabetic value such as KRW or USD."
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

function formatPayPeriodLabel(period: PayPeriod, copy: AdminSettingsCopy) {
  return period === "BIWEEKLY" ? copy.payPeriodOptions.biweekly : copy.payPeriodOptions.monthly;
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
    <main className="saas-content workspace-shell admin-workspace-shell">
      <header className="page-header workspace-page-header">
        <div>
          <h1 className="page-title">{copy.pageTitle}</h1>
          <p className="page-subtitle">{copy.pageSubtitle}</p>
          <p className="small muted workspace-source-banner">{copy.sourceHint}</p>
        </div>
        <div className="page-actions">
          <Link className="btn btn-secondary" href="/admin">
            {copy.navigation.backToHub}
          </Link>
          <Link className="btn btn-secondary" href="/admin/attendance-security">
            {copy.navigation.securitySettings}
          </Link>
          <button className="btn btn-secondary" type="button" onClick={() => void loadSettings()} disabled={isLoading}>
            {isLoading ? copy.reloadLoadingLabel : copy.reloadLabel}
          </button>
        </div>
      </header>

      <section className="kpi-strip workspace-summary-strip" aria-label={copy.pageTitle}>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.fiscalYearStartMonth}</p>
          <strong>{form.fiscalYearStartMonth}월</strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.workRule}</p>
          <strong>
            {form.standardWorkHoursPerDay}h · 주 {form.standardWorkDaysPerWeek}일
          </strong>
        </article>
        <article className="kpi-card workspace-summary-card">
          <p>{copy.summaryLabels.payPeriod}</p>
          <strong>{formatPayPeriodLabel(form.payPeriod, copy)}</strong>
        </article>
      </section>

      {error ? <p className="small fail workspace-inline-status">{error}</p> : null}
      {notice ? <p className="small ok workspace-inline-status">{notice}</p> : null}

      <section className="panel-grid workspace-panel-grid">
        <article className="panel workspace-section-card workspace-toolbar-card">
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

        <article className="panel workspace-section-card workspace-note-card">
          <h2>{copy.guideSectionTitle}</h2>
          <p className="small muted">{copy.guideSectionDescription}</p>
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
